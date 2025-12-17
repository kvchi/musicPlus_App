interface ImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
}

function Image(ImageProps: ImageProps) {
  return (
    <div>
      <img
        src={ImageProps.src}
        alt={ImageProps.alt}
        width={ImageProps.width}
        height={ImageProps.height}
      ></img>
    </div>
  );
}

export default Image;
