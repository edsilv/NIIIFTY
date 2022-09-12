import AuthCheck from "@/components/AuthCheck";
import { UserContext } from "@/utils/UserContext";
import { slugify } from "@/utils/Utils";
import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { remove } from "@/hooks/usePost";
import { usePaginatedPosts } from "@/hooks/usePaginatedPosts";
import CreatePostButton from "@/components/CreatePostButton";

export default function AdminPage(_props) {
  return <AuthCheck signedInContent={<Admin />}></AuthCheck>;
}

function Admin() {
  return <PostList />;
}

const PostList = () => {
  const { user, username, userAdapter } = useContext(UserContext);
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const [posts, allPostsLoaded, loading] = usePaginatedPosts(
    user,
    page,
    pageSize
  );

  return (
    <div className="w-full">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold">
            <>{t("myPosts")}</>
          </h1>
          {posts.length === 0 && (
            <p className="mt-2 text-sm">
              <>{t("noPostsFound")}</>
            </p>
          )}
        </div>
        <div className="mt-6 sm:mt-0 sm:ml-16 sm:flex-none">
          <CreatePostButton.Small href="/admin/create" />
        </div>
      </div>
      {posts.length > 0 && (
        <>
          <div className="mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:mx-0 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900"
                  >
                    <>{t("title")}</>
                  </th>
                  <th
                    scope="col"
                    className="hidden px-12 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell"
                  >
                    <>{t("modified")}</>
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">
                      <>{t("edit")}</>
                    </span>
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">
                      <>{t("delete")}</>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td className="w-full max-w-0 py-4 pr-3 pl-4 text-sm font-medium text-gray-900">
                      <a
                        href={`/${username}/${slugify(post.title)}`}
                        target="_blank"
                        className="text-blue-600 no-underline duration-500 hover:text-blue-900"
                      >
                        {post.title}
                      </a>
                    </td>
                    <td className="hidden whitespace-nowrap px-12 py-4 text-sm text-gray-500 lg:table-cell">
                      {`${new Date(
                        post.modified.toMillis()
                      ).toLocaleDateString()} | ${new Date(
                        post.modified.toMillis()
                      ).toLocaleTimeString()}`}
                    </td>
                    <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button
                        onClick={() => {
                          window.location.href = `/admin/${post.id}`;
                        }}
                        className="text-blue-600 duration-500 hover:text-blue-900"
                      >
                        <>{t("edit")}</>
                      </button>
                    </td>
                    <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              t("confirmPostDeletion", {
                                title: post.title,
                              })
                            )
                          ) {
                            remove(userAdapter, post.id);
                          }
                        }}
                        className="text-blue-600 duration-500 hover:text-blue-900"
                      >
                        <>{t("delete")}</>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 w-full text-sm">
            {loading && <>{t("loading")}</>}
            {!loading && !allPostsLoaded && (
              <button
                onClick={() => {
                  setPage(page + 1);
                }}
                className="text-blue-600 duration-500 hover:text-blue-900"
              >
                <>{t("showMore")}</>
              </button>
            )}
            {!loading && allPostsLoaded && <>{t("noMorePosts")}</>}
          </div>
        </>
      )}
    </div>
  );
};
