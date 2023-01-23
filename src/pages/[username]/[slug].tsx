import { FileProps } from "@/utils/Types";
import Metatags from "@/components/Metatags";
import { getFileBySlug, getUserWithUsername } from "@/utils/Firebase";
import { fileToJson } from "@/utils/Utils";

export async function getServerSideProps({ query }) {
  const { username, slug, embedded } = query;

  const user = await getUserWithUsername(username);

  // If no user, short circuit to 404 page
  if (!user) {
    return {
      notFound: true,
    };
  }

  let file: any = await getFileBySlug(user.uid, slug);

  // If no file, short circuit to 404 page
  if (!file) {
    return {
      notFound: true,
    };
  }

  // make serialisable as json
  file = fileToJson(file);

  return {
    props: { username, slug, file, embedded: !!embedded },
  };
}

export default function FilePage(props: FileProps) {
  const name: string = `NIIIFTY | ${props.file.id}`;
  // const description: string = striptags(props.file.description);

  return (
    <>
      <Metatags title={name} description={""} />
      <h1>{name}</h1>
    </>
  );
}
