import { NumberInput, ColorInput, CloseButton } from '@mantine/core';

import { IconPlus } from '@tabler/icons-react';
import { ActionIcon } from '@mantine/core';
import { useState } from 'react';

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
  const leftItemWidth = '25';
  const [inputToBeRemoved, setInputToBeRemoved] = useState<any>(null);

  const removeFeeRateColorInput = (index: number) => {
    // set inputToBeRemoved so that the component's style changes to animate-slideOut
    // and therefore the removing animation runs
    setInputToBeRemoved(index);

    const animationDuration = 300;
    // remove the feeRateColorInput in 300ms after the animation is done running.
    setTimeout(() => {
      const newFeeRateColorMapValues = [...feeRateColorMapValues];
      newFeeRateColorMapValues.splice(index, 1);
      components.splice(index, 1);
      removeFeeRateColor(index);
      setInputToBeRemoved(null);
    }, animationDuration);
  };

  for (let i = 0; i < numberOfInputs; i++) {
    const margin = i === 0 ? 'mt-4' : '';
    const styles = inputToBeRemoved === i ? 'animate-slideOutAndUp' : '';

    components.push(
      <div
        key={`${feeRateColorMapValues[i][1]}`}
        data-testid={`fee-rate-color-container-${i}`}
        className={` animate-slideIn flex flex-row items-end justify-between ${margin} ${styles}`}
      >
        {i > 0 && (
          <CloseButton
            style={{ marginBottom: '5px' }}
            size={25}
            className=" relative right-1"
            onClick={() => removeFeeRateColorInput(i)}
          />
        )}
        <NumberInput
          style={i === 0 ? { marginLeft: `${leftItemWidth}px` } : {}}
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
        data-testid={`add-fee-rate-color`}
        variant="white"
        size={leftItemWidth}
        className="mb-0 relative right-1 mt-1.5"
        onClick={addFeeRateColor}
      >
        <IconPlus />
      </ActionIcon>
    );
  };
  // don't allow adding more than 9 inputs
  if (components.length < 9) {
    components.push(<AddButton />);
  }
  return <> {components} </>;
};
