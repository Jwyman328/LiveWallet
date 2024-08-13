import { NumberInput, ColorInput, CloseButton } from '@mantine/core';

import { IconPlus } from '@tabler/icons-react';
import { ActionIcon } from '@mantine/core';

type FeeRateColorChangeInputsProps = {
  numberOfInputs: number;
  feeRateColorMapValues: [number, string][];
  changeFeeRateColorPercent: (index: number, percent: number) => void;
  changeFeeRateColor: (index: number, color: string) => void;
  removeFeeRateColor: (index: number) => void;
  addFeeRateColor: () => void;
};
export const FeeRateColorChangeInputs = ({
  numberOfInputs,
  feeRateColorMapValues,
  changeFeeRateColorPercent,
  changeFeeRateColor,
  removeFeeRateColor,
  addFeeRateColor,
}: FeeRateColorChangeInputsProps) => {
  const components = [];

  const removeFeeRateColorInput = (index: number) => {
    const newFeeRateColorMapValues = [...feeRateColorMapValues];
    newFeeRateColorMapValues.splice(index, 1);
    components.splice(index, 1);
    removeFeeRateColor(index);
  };
  for (let i = 0; i < numberOfInputs; i++) {
    const margin = i === 0 ? 'mt-4' : '';
    components.push(
      <div className={`flex flex-row items-end justify-between ${margin}`}>
        {i > 0 && (
          <CloseButton
            size={35}
            className="mb-0 relative right-1"
            onClick={() => removeFeeRateColorInput(i)}
          />
        )}
        <NumberInput
          style={i === 0 ? { marginLeft: '35px' } : {}}
          label={i === 0 ? 'Fee %' : undefined}
          placeholder="Percents"
          suffix="%"
          value={feeRateColorMapValues[i][0]}
          mt="md"
          onChange={(value) => changeFeeRateColorPercent(i, Number(value))}
        />
        <ColorInput
          withEyeDropper={false}
          format="rgb"
          value={feeRateColorMapValues[i][1]}
          className="ml-4"
          width={100}
          label={i === 0 ? 'Color' : undefined}
          onChange={(value) => changeFeeRateColor(i, value)}
        />
      </div>,
    );
  }
  const AddButton = () => {
    return (
      <ActionIcon
        variant="white"
        size="35"
        className="mb-0 relative right-1 mt-1.5"
        onClick={addFeeRateColor}
      >
        <IconPlus />
      </ActionIcon>
    );
  };

  if (components.length < 9) {
    components.push(<AddButton />);
  }
  return <> {components} </>;
};
