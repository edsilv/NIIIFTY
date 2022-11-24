import AuthCheck from "@/components/AuthCheck";
import ImageUploader from "@/components/ImageUploader";
import { useState } from "react";

export default function CreateExhibitPage(_props) {
  return <AuthCheck signedInContent={<CreatePost />}></AuthCheck>;
}

function CreatePost() {

  const [imageUrl, setImageURL] = useState(null);
  const [thumbnailURL, setThumbnailURL] = useState(null);

  return <div>
    <ImageUploader onComplete={({ imageURL, thumbnailURL }) => {
      console.log("onComplete");
      setImageURL(imageURL);
      setThumbnailURL(thumbnailURL);

      // todo: once image is uploaded allow user to create post
      // this will call the ipfs upload function as we'll have a post in firestore
      // to store the cid in. addImageToW3S(postid, imagename) => cid
    }} />

    {imageUrl && <p>{imageUrl}</p>}
    {thumbnailURL && <p>{thumbnailURL}</p>}
  </div>;
}
