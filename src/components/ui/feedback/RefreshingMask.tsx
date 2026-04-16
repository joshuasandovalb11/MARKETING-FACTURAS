import LoadingLayer from './LoadingLayer';

export default function RefreshingMask() {
  return (
    <LoadingLayer variant="absolute" className="bg-white/25 backdrop-blur-xs" />
  );
}
