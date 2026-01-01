import ProfileView from "./ProfileView";

type UserProfilePageProps = {
  params: {
    username: string;
  };
};

export default function UserProfilePage({ params }: UserProfilePageProps) {
  return <ProfileView username={params.username} />;
}
