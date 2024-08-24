import {
  NumberInput,
  ColorInput,
  CloseButton,
  InputLabel,
} from '@mantine/core';

import { IconPlus } from '@tabler/icons-react';
import { ActionIcon } from '@mantine/core';
import { memo, useCallback, useMemo, useState } from 'react';
import { usePrevious } from '../hooks/utils';

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
  const leftItemWidth = '25';
  const [inputToBeRemoved, setInputToBeRemoved] = useState<any>(null);
  const previousNumberOfInputs: number | undefined =
    usePrevious(numberOfInputs);

  const feeRateColorInputs = useMemo(() => {
    const components = [];
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

    const shouldAnimateIn = (i: number) => {
      const isLastItem = i === numberOfInputs - 1;

      if (!isLastItem) {
        // do not animate if not the last item
        return false;
      }

      if (previousNumberOfInputs === undefined) {
        // first render therefore do not animate last item
        return false;
      }

      const didThisInputJustGetAdded = previousNumberOfInputs < numberOfInputs;

      if (didThisInputJustGetAdded && isLastItem) {
        return true;
      }
    };

    for (let i = 0; i < numberOfInputs; i++) {
      const isAnimateIn = shouldAnimateIn(i);

      components.push(
        <FeeRateColorInput
          i={i}
          isBeingRemoved={i === inputToBeRemoved}
          removeFeeRateColorInput={removeFeeRateColorInput}
          changeFeeRateColorPercent={changeFeeRateColorPercent}
          changeFeeRateColor={changeFeeRateColor}
          leftItemWidth={leftItemWidth}
          percent={feeRateColorMapValues[i][0]}
          color={feeRateColorMapValues[i][1]}
          isAnimateIn={isAnimateIn}
        />,
      );
    }
    return components as JSX.Element[];
  }, [feeRateColorMapValues, inputToBeRemoved, numberOfInputs]);

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

  return (
    <div className="flex flex-col">
      <div
        style={{ marginLeft: `${leftItemWidth}px` }}
        className="w-full flex flex-row justify-evenly"
      >
        <InputLabel className="flex-1">Fee %</InputLabel>
        <InputLabel className="flex-1">Color</InputLabel>
      </div>
      <div
        style={{
          maxHeight: '420px',
        }}
        className="overflow-y-scroll"
      >
        {feeRateColorInputs}
      </div>
      {feeRateColorInputs.length < 8 && <AddButton />}
    </div>
  );
};

type FeeRateColorInputProps = {
  i: number;
  isBeingRemoved: boolean;
  changeFeeRateColorPercent: (index: number, percent: number) => void;
  changeFeeRateColor: (index: number, color: string) => void;
  removeFeeRateColorInput: (index: number) => void;
  leftItemWidth: string;
  percent: string | number;
  color: string;
  isAnimateIn: boolean;
};

const FeeRateColorInput = memo(
  ({
    i,
    isBeingRemoved,
    removeFeeRateColorInput,
    changeFeeRateColorPercent,
    changeFeeRateColor,
    leftItemWidth,
    percent,
    color,
    isAnimateIn,
  }: FeeRateColorInputProps) => {
    const margin = i === 0 ? 'mt-0' : '';
    const styles = isBeingRemoved ? 'animate-slideOutAndUp' : '';
    const appearAnimation = isAnimateIn ? 'animate-slideIn' : '';
    return (
      <div
        key={`${i}`}
        data-testid={`fee-rate-color-container-${i}`}
        className={` ${appearAnimation} flex flex-row items-end justify-between ${margin} ${styles}`}
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
          placeholder="Percents"
          suffix="%"
          value={percent}
          mt="md"
          onChange={(value) => changeFeeRateColorPercent(i, Number(value))}
        />
        <ColorInput
          withEyeDropper={false}
          format="rgb"
          value={color}
          className="ml-4"
          width={100}
          onChange={(value) => changeFeeRateColor(i, value)}
        />
      </div>
    );
  },
);
