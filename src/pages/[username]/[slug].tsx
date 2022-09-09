import { PostProps } from "@/utils/Types";
import Metatags from "@/components/Metatags";
import { getPostBySlug, getUserWithUsername } from "@/utils/Firebase";
import { postToJson } from "@/utils/Utils";
const striptags = require("striptags");

export async function getServerSideProps({ query }) {
  const { username, slug, embedded } = query;

  const user = await getUserWithUsername(username);

  // If no user, short circuit to 404 page
  if (!user) {
    return {
      notFound: true,
    };
  }

  let post = await getPostBySlug(user.uid, slug);

  // If no post, short circuit to 404 page
  if (!post) {
    return {
      notFound: true,
    };
  }

  // make serialisable as json
  post = postToJson(post);

  return {
    props: { username, slug, post, embedded: !!embedded },
  };
}

export default function PostPage(props: PostProps) {
  const title: string = `NIIIFTY | ${props.post.title}`;
  const description: string = striptags(props.post.description);

  return (
    <>
      <Metatags title={title} description={description} />
      <h1>{title}</h1>
      <div>{description}</div>
    </>
  );
}
