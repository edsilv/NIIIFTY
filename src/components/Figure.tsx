const Figure = ({
  title,
  img,
  video,
}: {
  title: string;
  img?: string | undefined;
  video?: string | undefined;
}) => {
  return (
    <figure>
      {img && <img alt={title} src={img} />}
      {video && (
        <video title={title} loop autoPlay muted playsInline src={video} />
      )}
    </figure>
  );
};

export default Figure;
