"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// DM-322: Profile page removed for Wednesday demo — X OAuth is the
// source of truth for identity. Any inbound links now redirect to /crafting.
export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/crafting");
  }, [router]);

  return null;
}
