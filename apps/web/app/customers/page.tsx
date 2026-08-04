import type { Metadata } from "next";
import { MarketingCustomers } from "../../components/marketing-customers";

export const metadata: Metadata = {
  title: "Customers | Supademo",
  description:
    "See how ambitious teams use Supademo to make product demos more useful and easier to scale."
};

export default function CustomersPage() {
  return <MarketingCustomers />;
}
