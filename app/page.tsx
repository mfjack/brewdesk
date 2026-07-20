import { Suspense } from "react";
import OrderPage from "./order/page";

export default function Page() {
   return (
      <Suspense>
         <OrderPage />
      </Suspense>
   );
}
