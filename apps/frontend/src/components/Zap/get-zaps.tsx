import { useState, useEffect } from "react";
import { Zap } from "@/lib/types";
import api from "@/lib/api";

export default function GetZaps() {
  const [loading, setLoading] = useState(true);
  const [zaps, setZaps] = useState<Zap[]>([]);

  useEffect(() => {
    api
      .get("/zap/", {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      })
      .then((res) => {
        setZaps(res.data.zaps);
        setLoading(false);
      });
  }, []);

  return {
    loading,
    zaps,
  };
}