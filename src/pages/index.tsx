import Link from "@/components/Link";
import Metatags from "@/components/Metatags";
import { title, description } from "../utils/Config";

// export async function getStaticProps(context) {
//   return {
//     props: {},
//   };
// }

const MAX_DISPLAY = 5;

export default function Home() {
  const posts = [
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
      <p>Home page (todo)</p>
      {/* <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pt-6 pb-8 md:space-y-5">
          <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
            Latest
          </h1>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {!posts.length && "No posts found."}
          {posts.slice(0, MAX_DISPLAY).map((post) => {
            const { slug, date, title, description } = post;
            return (
              <li key={slug} className="py-12">
                <article>
                  <div className="space-y-2 xl:grid xl:grid-cols-4 xl:items-baseline xl:space-y-0">
                    <dl>
                      <dt className="sr-only">Published on</dt>
                      <dd className="text-base font-medium leading-6 text-gray-500 dark:text-gray-400">
                        <time dateTime={date}>{date}</time>
                      </dd>
                    </dl>
                    <div className="space-y-5 xl:col-span-3">
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-2xl font-bold leading-8 tracking-tight">
                            <Link
                              href={`/blog/${slug}`}
                              className="text-gray-900 dark:text-gray-100"
                            >
                              {title}
                            </Link>
                          </h2>
                        </div>
                        <div className="prose max-w-none text-gray-500 dark:text-gray-400">
                          {description}
                        </div>
                      </div>
                      <div className="text-base font-medium leading-6">
                        <Link
                          href={`/blog/${slug}`}
                          className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                          aria-label={`Read "${title}"`}
                        >
                          Read more &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div> */}
      {/* {posts.length > MAX_DISPLAY && (
        <div className="flex justify-end text-base font-medium leading-6">
          <Link
            href="/blog"
            className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
            aria-label="all posts"
          >
            All Posts &rarr;
          </Link>
        </div>
      )} */}
    </>
  );
}
