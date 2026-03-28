import { StyleSheet } from 'react-native';

export const internalPageStyles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  titleRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleText: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  searchBar: {
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 12,
  },
  searchText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  chipsRow: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 16,
  },
  chipPill: {
    minHeight: 46,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
