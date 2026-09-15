import { Suspense } from "react";
import OrderPageContent from "./_components/order-page-content";

export default function Page() {
   return (
      <Suspense>
         <OrderPageContent />
      </Suspense>
   );
}
