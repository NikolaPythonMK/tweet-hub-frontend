import { useEffect, useState } from "react";
import { me } from "../api/auth";
import type { User } from "../api/types";

export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    me()
      .then((response) => {
        if (active) {
          setUser(response.user);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return { user, setUser, loading };
}
