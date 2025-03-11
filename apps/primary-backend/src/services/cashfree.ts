// import axios from "axios";
//
// const cashfree = axios.create({
//   baseURL: "https://api.cashfree.com/pg",
//   headers: {
//     "x-client-id": process.env.CASHFREE_APP_ID || "",
//     "x-client-secret": process.env.CASHFREE_SECRET_KEY || "",
//   },
// });
//
// export const createCashfreeOrder = async (user: any, plan: any) => {
//   const response = await cashfree.post("/orders", {
//     order_id: `ORDER_${Date.now()}`,
//     order_amount: plan.price.toString(),
//     order_currency: plan.currency,
//     customer_details: {
//       customer_id: user.id,
//       customer_email: user.email,
//     },
//     order_meta: {
//       return_url: `${process.env.FRONTEND_URL}/payment/callback`,
//     },
//   });
//   const { payment_link, order_id } = response.data;
//   if (!payment_link) throw new Error("Failed to create Cashfree payment link");
//
//   return { payment_link, order_id };
// };
