import { useState } from "react";

const userWebhook = () => {
  const [userSubscription, setUserSubscription] = useState("free");

  return {
    userSubscription,
    setUserSubscription,
  };
};

export default userWebhook;
