type TrezorKeypadProps = {
  onPadClick: (padNumber: string) => void;
  currentPin: string;
};
export const TrezorKeypad = ({ onPadClick, currentPin }: TrezorKeypadProps) => {
  return (
    <div className="flex flex-col">
      <div className="flex flex-row">
        <Pad onClick={() => onPadClick(`${currentPin}7`)} />
        <Pad onClick={() => onPadClick(`${currentPin}8`)} />
        <Pad onClick={() => onPadClick(`${currentPin}9`)} />
      </div>
      <div className="flex flex-row">
        <Pad onClick={() => onPadClick(`${currentPin}4`)} />
        <Pad onClick={() => onPadClick(`${currentPin}5`)} />
        <Pad onClick={() => onPadClick(`${currentPin}6`)} />
      </div>
      <div className="flex flex-row">
        <Pad onClick={() => onPadClick(`${currentPin}1`)} />
        <Pad onClick={() => onPadClick(`${currentPin}2`)} />
        <Pad onClick={() => onPadClick(`${currentPin}3`)} />
      </div>
    </div>
  );
};

type PadProps = {
  onClick: () => void;
};
const Pad = ({ onClick }: PadProps) => {
  return (
    <div
      onClick={onClick}
      className="w-10 bg-gray-300 h-10 flex flex-row justify-center items-center mb-2 mr-2 border-gray-500"
      style={{ borderWidth: '1px' }}
    >
      <div className="w-5 h-5 bg-black rounded-full"></div>
    </div>
  );
};
