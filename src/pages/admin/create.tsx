import AuthCheck from "@/components/AuthCheck";

export default function CreateExhibitPage(_props) {
  return <AuthCheck signedInContent={<CreateExhibit />}></AuthCheck>;
}

function CreateExhibit() {
  return <div>Create Exhibit</div>;
}
