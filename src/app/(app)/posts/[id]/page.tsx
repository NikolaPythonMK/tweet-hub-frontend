import PostDetailView from "./PostDetailView";

type PostDetailPageProps = {
  params: {
    id: string;
  };
};

export default function PostDetailPage({ params }: PostDetailPageProps) {
  return <PostDetailView postId={params.id} />;
}
