import ProfileView from "./ProfileView";

type UserProfilePageProps = {
  params: Promise<{
    username: string;
  }>;
};

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { username } = await params;
  return <ProfileView username={username} />;
}
