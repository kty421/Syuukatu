import Animated, { FadeInDown } from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';

import { AppTheme } from '../../../constants/theme';
import { SectionHeader } from '../../../ui/SectionHeader';
import { Company, SelectionStatus } from '../types';
import { CompanyCard } from './CompanyCard';

type CompanySectionProps = {
  title: string;
  companies: Company[];
  theme: AppTheme;
  showPasswordControls: boolean;
  isPasswordVisible: (id: string) => boolean;
  statusOptions: SelectionStatus[];
  isStatusSaving: (id: string) => boolean;
  onEdit: (company: Company) => void;
  onTogglePassword: (id: string) => void;
  onCopy: (value: string, label: string) => void;
  onOpenUrl: (company: Company) => void;
  onDelete: (company: Company) => void;
  onStatusChange: (company: Company, status: SelectionStatus) => void;
};

export const CompanySection = ({
  title,
  companies,
  theme,
  showPasswordControls,
  isPasswordVisible,
  statusOptions,
  isStatusSaving,
  onEdit,
  onTogglePassword,
  onCopy,
  onOpenUrl,
  onDelete,
  onStatusChange
}: CompanySectionProps) => (
  <Animated.View
    entering={FadeInDown.duration(theme.motion.standard)}
    style={styles.section}
  >
    <SectionHeader
      title={title}
      count={companies.length}
      theme={theme}
    />

    <View
      style={[
        styles.surface,
        theme.shadows.surface,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border
        }
      ]}
    >
      {companies.map((company, index) => (
        <View key={company.id}>
          {index > 0 ? (
            <View
              style={[
                styles.divider,
                { backgroundColor: theme.colors.divider }
              ]}
            />
          ) : null}
          <CompanyCard
            company={company}
            isPasswordVisible={isPasswordVisible(company.id)}
            showPasswordControls={showPasswordControls}
            statusOptions={statusOptions}
            isStatusSaving={isStatusSaving(company.id)}
            theme={theme}
            onPress={() => onEdit(company)}
            onTogglePassword={() => onTogglePassword(company.id)}
            onCopy={onCopy}
            onOpenUrl={() => onOpenUrl(company)}
            onDelete={() => onDelete(company)}
            onStatusChange={(status) => onStatusChange(company, status)}
          />
        </View>
      ))}
    </View>
  </Animated.View>
);

const styles = StyleSheet.create({
  section: {
    marginTop: 24
  },
  surface: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    overflow: 'hidden'
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 20
  }
});
