import type { Metadata } from "next";
import { ReviewCommentsWorkbench } from "../../components/review-comments-workbench";

export const metadata: Metadata = {
  title: "Comments Review | Supademo",
  description: "Review internal and external comments on a demo."
};

export default function CommentsPage() {
  return <ReviewCommentsWorkbench />;
}
