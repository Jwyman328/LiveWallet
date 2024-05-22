import { Drawer } from '@mantine/core';
type SettingsSlideoutProps = {
  opened: boolean;
  onClose: () => void;
  children: React.ReactNode;
};
export const SettingsSlideout = ({
  opened,
  onClose,
  children,
}: SettingsSlideoutProps) => {
  const Title = () => {
    return (
      <h1 className="text-2xl font-semibold text-blue-500 text-center">
        Settings
      </h1>
    );
  };
  return (
    <Drawer
      title={<Title />}
      opened={opened}
      onClose={onClose}
      withCloseButton
      position="right"
    >
      <div className="h-full">
        {children}
      </div>
    </Drawer>
  );
};
