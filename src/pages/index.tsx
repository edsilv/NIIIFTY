import CreateFileButton from "@/components/CreateFileButton";
// import Link from "@/components/Link";
import Metatags from "@/components/Metatags";
import { hash } from "@/utils/Utils";
import { title, description } from "../utils/Config";

// export async function getStaticProps(context) {
//   return {
//     props: {},
//   };
// }

const MAX_DISPLAY = 5;

export default function Home() {
  const files = [
    {
      slug: "test",
      title: "Test",
      description: "Test description",
      date: "2021-01-01",
    },
    {
      slug: "test2",
      title: "Test 2",
      description: "Test description 2",
      date: "2021-01-01",
    },
    {
      slug: "test3",
      title: "Test 3",
      description: "Test description 3",
      date: "2021-01-01",
    },
    {
      slug: "test4",
      title: "Test 4",
      description: "Test description 4",
      date: "2021-01-01",
    },
    {
      slug: "test5",
      title: "Test 5",
      description: "Test description 5",
      date: "2021-01-01",
    },
    {
      slug: "test6",
      title: "Test 6",
      description: "Test description 6",
      date: "2021-01-01",
    },
    {
      slug: "test7",
      title: "Test 7",
      description: "Test description 7",
      date: "2021-01-01",
    },
  ];

  return (
    <>
      <Metatags title={title} description={description} />
      <div className="w-56">
        <CreateFileButton.Large href="/admin" />
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
