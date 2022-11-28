import AuthCheck from "@/components/AuthCheck";
import FileUploader from "@/components/FileUploader";
import { useContext, useState } from "react";
import { add } from "@/hooks/useFile";
import { UserContext } from "@/utils/UserContext";

export default function CreateExhibitPage(_props) {
  return <AuthCheck signedInContent={<CreateFile />}></AuthCheck>;
}

function CreateFile() {
  const { user, userAdapter } = useContext<UserContext>(UserContext);

  // const [imageUrl, setImageURL] = useState(null);
  // const [thumbnailURL, setThumbnailURL] = useState(null);

  // todo: auto-detect file type when drag/dropped instead of relying on user to select
  return <div>
    <FileUploader onComplete={async ({ id }) => {
      console.log("onComplete");
      // setImageURL(imageURL);
      // setThumbnailURL(thumbnailURL);

      console.log("uploaded file", id);

      // create file in firestore
      // const fileid = await add(userAdapter!, {
      //   uid: user.uid,
      //   name: "Untitled",
      // });

      // console.log("added file", fileid);

      // todo: once image is uploaded allow user to create file
      // this will call the ipfs upload function as we'll have a file in firestore
      // to store the cid in. addImageToW3S(fileid, imagename) => cid
    }} />

    {/* {imageUrl && <p>{imageUrl}</p>}
    {thumbnailURL && <p>{thumbnailURL}</p>} */}
  </div>;
}
