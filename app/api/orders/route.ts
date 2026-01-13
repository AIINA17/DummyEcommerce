    import { NextResponse } from "next/server";
    import { supabase } from "@/lib/supabase";
    import { getServerSession } from "next-auth";
    import { authOptions } from "@/lib/auth";

    function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
    }

    function toNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }
    return null;
    }

    type OrderItemInput = {
    product_id: number;
    quantity: number;
    price: number;
    name: string;
    };

    // GET orders of logged-in user
    export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ success: false }, { status: 401 });
    }

    const { data, error } = await supabase
        .from("orders")
        .select(
        `
        *,
        order_items (
            id,
            product_id,
            quantity,
            price_at_purchase,
            name_snapshot
        )
        `
        )
        .eq("user_id", Number(session.user.id))
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
        );
    }

    return NextResponse.json({ success: true, data: data || [] });
    }

    // POST create new order
    export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
        );
    }

    const user_id = Number(session.user.id);

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
        );
    }

    if (!isRecord(body)) {
        return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
        );
    }

    const items_raw = body.items;
    const payment_method_raw = body.payment_method;

    if (!Array.isArray(items_raw) || items_raw.length === 0) {
        return NextResponse.json(
        { success: false, message: "No items provided" },
        { status: 400 }
        );
    }

    const items: OrderItemInput[] = [];

    for (const raw of items_raw) {
        if (!isRecord(raw)) {
        return NextResponse.json(
            { success: false, message: "Invalid items payload" },
            { status: 400 }
        );
        }

        const product_id = toNumber(raw.product_id);
        const quantity = toNumber(raw.quantity);
        const price = toNumber(raw.price);
        const name = typeof raw.name === "string" ? raw.name : null;

        if (!product_id || !quantity || !price || !name) {
        return NextResponse.json(
            { success: false, message: "Invalid items payload" },
            { status: 400 }
        );
        }

        items.push({ product_id, quantity, price, name });
    }

    const payment_method =
        typeof payment_method_raw === "string" &&
        payment_method_raw.trim() !== ""
        ? payment_method_raw
        : undefined;

    const normalizedPayment = payment_method
        ?.toUpperCase()
        .replace(/\s/g, "_");

    const total = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    // ShopKu Pay logic
    if (normalizedPayment === "SHOPKUPAY") {
        const { data: user, error: userError } = await supabase
        .from("users")
        .select("balance")
        .eq("id", user_id)
        .single();

        if (userError || !user) {
        return NextResponse.json(
            { success: false, message: "User not found" },
            { status: 404 }
        );
        }

        const balance = Number(user.balance);

        if (balance < total) {
        return NextResponse.json(
            { success: false, message: "Insufficient ShopKu Pay balance" },
            { status: 400 }
        );
        }

        const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({ balance: balance - total })
        .eq("id", user_id)
        .select()
        .single();

        console.log("UPDATE RESULT:", updatedUser, updateError);


        if (updateError) {
        return NextResponse.json(
            { success: false, message: updateError.message },
            { status: 500 }
        );
        }
    }

    // Create order
    const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
        user_id,
        payment_method: normalizedPayment || "UNSELECTED",
        status: normalizedPayment === "SHOPKUPAY" ? "paid" : "pending",
        total,
        })
        .select()
        .single();

    if (orderError) {
        return NextResponse.json(
        { success: false, message: orderError.message },
        { status: 500 }
        );
    }

    const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: item.price,
        name_snapshot: item.name,
    }));

    const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

    if (itemsError) {
        await supabase.from("orders").delete().eq("id", order.id);
        return NextResponse.json(
        { success: false, message: itemsError.message },
        { status: 500 }
        );
    }

    return NextResponse.json({
        success: true,
        data: { ...order, items: orderItems },
    });
    }
