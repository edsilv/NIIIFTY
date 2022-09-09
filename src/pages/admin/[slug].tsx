import AuthCheck from "@/components/AuthCheck";
import { useRouter } from "next/router";

export default function EditPostPage(_props) {
  const router = useRouter();
  const { slug } = router.query;

  return <AuthCheck signedInContent={<EditPost id={slug} />}></AuthCheck>;
}

function EditPost(id) {
  return <div>Editing {id}</div>;
}
