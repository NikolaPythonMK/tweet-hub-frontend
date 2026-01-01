import PostDetailView from "./PostDetailView";

type PostDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = await params;
  return <PostDetailView postId={id} />;
}
