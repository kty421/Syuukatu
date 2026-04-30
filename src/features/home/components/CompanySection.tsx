import Animated, { FadeInDown } from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';

import { AppTheme } from '../../../constants/theme';
import { SectionHeader } from '../../../ui/SectionHeader';
import { Company } from '../types';
import { CompanyCard } from './CompanyCard';

type CompanySectionProps = {
  title: string;
  companies: Company[];
  theme: AppTheme;
  visiblePasswordIds: Set<string>;
  onEdit: (company: Company) => void;
  onTogglePassword: (id: string) => void;
  onToggleFavorite: (company: Company) => void;
  onCopy: (value: string, label: string) => void;
  onOpenUrl: (company: Company) => void;
  onDelete: (company: Company) => void;
};

export const CompanySection = ({
  title,
  companies,
  theme,
  visiblePasswordIds,
  onEdit,
  onTogglePassword,
  onToggleFavorite,
  onCopy,
  onOpenUrl,
  onDelete
}: CompanySectionProps) => (
  <Animated.View
    entering={FadeInDown.duration(theme.motion.standard)}
    style={styles.section}
  >
    <SectionHeader
      eyebrow="選考状況"
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
          borderColor: theme.colors.outline
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
            isPasswordVisible={visiblePasswordIds.has(company.id)}
            theme={theme}
            onPress={() => onEdit(company)}
            onTogglePassword={() => onTogglePassword(company.id)}
            onToggleFavorite={() => onToggleFavorite(company)}
            onCopy={onCopy}
            onOpenUrl={() => onOpenUrl(company)}
            onDelete={() => onDelete(company)}
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
