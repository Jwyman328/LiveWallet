type TrezorKeypadProps = {
  onPadClick: (padNumber: string) => void;
  currentPin: string;
};
export const TrezorKeypad = ({ onPadClick, currentPin }: TrezorKeypadProps) => {
  return (
    <div className="flex flex-col">
      <div className="flex flex-row">
        <Pad
          testid="keypad-top-left"
          onClick={() => onPadClick(`${currentPin}7`)}
        />
        <Pad
          testid="keypad-top-middle"
          onClick={() => onPadClick(`${currentPin}8`)}
        />
        <Pad
          testid="keypad-top-right"
          onClick={() => onPadClick(`${currentPin}9`)}
        />
      </div>
      <div className="flex flex-row">
        <Pad
          testid="keypad-middle-left"
          onClick={() => onPadClick(`${currentPin}4`)}
        />
        <Pad
          testid="keypad-middle-middle"
          onClick={() => onPadClick(`${currentPin}5`)}
        />
        <Pad
          testid="keypad-middle-right"
          onClick={() => onPadClick(`${currentPin}6`)}
        />
      </div>
      <div className="flex flex-row">
        <Pad
          testid="keypad-bottom-left"
          onClick={() => onPadClick(`${currentPin}1`)}
        />
        <Pad
          testid="keypad-bottom-middle"
          onClick={() => onPadClick(`${currentPin}2`)}
        />
        <Pad
          testid="keypad-bottom-right"
          onClick={() => onPadClick(`${currentPin}3`)}
        />
      </div>
    </div>
  );
};

type PadProps = {
  onClick: () => void;
  testid?: string;
};
const Pad = ({ onClick, testid }: PadProps) => {
  return (
    <div
      data-testid={testid}
      onClick={onClick}
      className="w-10 bg-gray-300 h-10 flex flex-row justify-center items-center mb-2 mr-2 border-gray-500"
      style={{ borderWidth: '1px' }}
    >
      <div className="w-5 h-5 bg-black rounded-full"></div>
    </div>
  );
};
