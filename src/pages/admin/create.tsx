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
    }} />

    {imageUrl && <p>{imageUrl}</p>}
    {thumbnailURL && <p>{thumbnailURL}</p>}
  </div>;
}
