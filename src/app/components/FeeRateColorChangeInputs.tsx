import { NumberInput, ColorInput } from '@mantine/core';

type FeeRateColorChangeInputsProps = {
  numberOfInputs: number;
  feeRateColorMapValues: [number, string][];
  changeFeeRateColorPercent: (index: number, percent: number) => void;
  changeFeeRateColor: (index: number, color: string) => void;
};
export const FeeRateColorChangeInputs = ({
  numberOfInputs,
  feeRateColorMapValues,
  changeFeeRateColorPercent,
  changeFeeRateColor,
}: FeeRateColorChangeInputsProps) => {
  const components = [];
  for (let i = 0; i < numberOfInputs; i++) {
    const margin = i === 0 ? 'mt-4' : '';
    components.push(
      <div className={`flex flex-row items-end justify-between ${margin}`}>
        <NumberInput
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
  return <> {components} </>;
};
