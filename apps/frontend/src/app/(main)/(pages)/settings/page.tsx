import ProfileForm from "@/components/forms/profile-form";
import Header from "@/components/globals/heading";
import React from "react";

export default function SettingPage() {
  return (
    <Header heading="Setting">
      <div className="flex flex-col gap-10 p-6">
        <div>
          <h2 className="text-2xl font-bold">User Profile</h2>
          <p className="text-base text-white/50">
            Add or Update your Information
          </p>
        </div>
        <ProfileForm />
      </div>
    </Header>
  );
}
