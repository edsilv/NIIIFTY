import AuthCheck from "@/components/AuthCheck";
import { useRouter } from "next/router";

export default function EditFilePage(_props) {
  const router = useRouter();
  const { slug } = router.query;

  return <AuthCheck signedInContent={<EditFile id={slug} />}></AuthCheck>;
}

function EditFile(id) {
  return <div>Editing {id}</div>;
}
