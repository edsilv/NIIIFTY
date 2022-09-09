import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";
import { db } from "@/utils/Firebase";
import { useEffect, useState } from "react";
import { postToJson } from "@/utils/Utils";
import { Post } from "@/utils/Types";

export const usePaginatedPosts = (
  user,
  page: number = 0,
  pageSize: number = 10
): [posts: Post[], allLoaded: boolean, loading: boolean] => {
  const [posts, setExhibits] = useState<Post[]>([]);
  const [lastVisible, setLastVisible] = useState({});
  const [allLoaded, setAllLoaded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let unsubscribe;

    setLoading(true);

    const firstPage = query(
      collection(db, `users/${user.uid}/posts`),
      orderBy("modified", "desc"),
      limit(pageSize)
    );

    unsubscribe = onSnapshot(firstPage, (results) => {
      setLoading(false);
      setExhibits(
        results.docs.map((doc) => postToJson({ ...doc.data(), id: doc.id }))
      );
      setLastVisible(results.docs[results.docs.length - 1]);
    });

    return () => {
      // unsubscribe();
    };
  }, []);

  useEffect(() => {
    let unsubscribe;

    if (page > 0) {
      setLoading(true);

      const nextPage = query(
        collection(db, `users/${user.uid}/posts`),
        orderBy("modified", "desc"),
        startAfter(lastVisible),
        limit(pageSize)
      );

      unsubscribe = onSnapshot(nextPage, (results) => {
        setLoading(false);
        if (results.docs.length === 0) {
          setAllLoaded(true);
        } else {
          setExhibits([
            ...posts,
            ...results.docs.map((doc) =>
              postToJson({ ...doc.data(), id: doc.id })
            ),
          ]);
          setLastVisible(results.docs[results.docs.length - 1]);
        }
      });
    }

    return () => {
      // unsubscribe();
    };
  }, [page]);

  return [posts, allLoaded, loading];
};
