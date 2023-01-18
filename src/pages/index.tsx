import UploadFileButton from "@/components/UploadFileButton";
// import Link from "@/components/Link";
import Metatags from "@/components/Metatags";
import { title, description } from "../utils/Config";

export default function Home() {

  return (
    <>
      <Metatags title={title} description={description} />
      <div className="w-56">
        <UploadFileButton.Large href="/admin" />
      </div>
      {/* <p>
        {
          hashedUname
        }
      </p>
      <p>
        {
          hashedPWD
        }
      </p> */}
    </>
  );
}
