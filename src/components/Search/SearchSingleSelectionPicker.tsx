import React, {useEffect, useState} from 'react';
import SingleSelectListItem from '@components/SelectionList/ListItem/SingleSelectListItem';
import SelectionListWithSections from '@components/SelectionList/SelectionListWithSections';
import useDebouncedState from '@hooks/useDebouncedState';
import useLocalize from '@hooks/useLocalize';
import Navigation from '@libs/Navigation/Navigation';
import type {OptionData} from '@libs/ReportUtils';
import {sortOptionsWithEmptyValue} from '@libs/SearchQueryUtils';
import CONST from '@src/CONST';
import ROUTES from '@src/ROUTES';
import type {Route} from '@src/ROUTES';
import SearchFilterPageFooterButtons from './SearchFilterPageFooterButtons';

type SearchSingleSelectionPickerItem = {
    name: string;
    value: string;
};

type SearchSingleSelectionPickerProps = {
    items: SearchSingleSelectionPickerItem[];
    initiallySelectedItem: SearchSingleSelectionPickerItem | undefined;
    pickerTitle?: string;
    onSaveSelection: (value: string | undefined) => void;
    backToRoute?: Route;
    shouldAutoSave?: boolean;
    shouldShowTextInput?: boolean;
    shouldShowNoneOption?: boolean;
};

function SearchSingleSelectionPicker({
    items,
    initiallySelectedItem,
    pickerTitle,
    onSaveSelection,
    backToRoute,
    shouldAutoSave,
    shouldShowTextInput = true,
    shouldShowNoneOption = false,
}: SearchSingleSelectionPickerProps) {
    const {translate, localeCompare} = useLocalize();

    const [searchTerm, debouncedSearchTerm, setSearchTerm] = useDebouncedState('');
    const [selectedItem, setSelectedItem] = useState<SearchSingleSelectionPickerItem | undefined>(initiallySelectedItem);

    useEffect(() => {
        setSelectedItem(initiallySelectedItem);
    }, [initiallySelectedItem]);

    const initiallySelectedItemSection = initiallySelectedItem?.name.toLowerCase().includes(debouncedSearchTerm?.toLowerCase())
        ? [
              {
                  text: initiallySelectedItem.name,
                  keyForList: initiallySelectedItem.value,
                  isSelected: selectedItem?.value === initiallySelectedItem.value,
                  value: initiallySelectedItem.value,
              },
          ]
        : [];

    const remainingItemsSection = items
        .filter((item) => item.value !== initiallySelectedItem?.value && item.name.toLowerCase().includes(debouncedSearchTerm?.toLowerCase()))
        .sort((a, b) => sortOptionsWithEmptyValue(a.name.toString(), b.name.toString(), localeCompare))
        .map((item) => ({
            text: item.name,
            keyForList: item.value,
            isSelected: selectedItem?.value === item.value,
            value: item.value,
        }));

    const noResultsFound = !initiallySelectedItemSection.length && !remainingItemsSection.length;

    const noneOptionSection =
        shouldShowNoneOption && !noResultsFound
            ? [
                  {
                      text: translate('common.none'),
                      keyForList: CONST.SEARCH.NONE_OPTION_ITEM_VALUE,
                      isSelected: !selectedItem?.value,
                      value: CONST.SEARCH.NONE_OPTION_ITEM_VALUE,
                  },
              ]
            : [];

    const sections = noResultsFound
        ? []
        : [
              {
                  title: undefined,
                  data: noneOptionSection,
                  sectionIndex: 0,
              },
              {
                  title: undefined,
                  data: initiallySelectedItemSection,
                  sectionIndex: 1,
              },
              {
                  title: pickerTitle,
                  data: remainingItemsSection,
                  sectionIndex: 2,
              },
          ];

    const onSelectItem = (item: Partial<OptionData & SearchSingleSelectionPickerItem>) => {
        if (!item.text || !item.keyForList || !item.value) {
            return;
        }

        const isNoneOption = item.value === CONST.SEARCH.NONE_OPTION_ITEM_VALUE;
        const valueToSave = isNoneOption || item.isSelected ? undefined : item.value;
        // or we can make re-clicking the same item to do nothing
        // if (item.isSelected && !isNoneOption) {
        //     return;
        // }
        // const valueToSave = isNoneOption ? undefined : item.value;

        if (shouldAutoSave) {
            onSaveSelection(valueToSave);
            Navigation.goBack(backToRoute ?? ROUTES.SEARCH_ADVANCED_FILTERS.getRoute());
            return;
        }

        if (valueToSave === undefined) {
            setSelectedItem(undefined);
            return;
        }

        setSelectedItem({name: item.text, value: item.value});
    };

    const resetChanges = () => {
        setSelectedItem(undefined);
    };

    const applyChanges = () => {
        onSaveSelection(selectedItem?.value);
        Navigation.goBack(backToRoute ?? ROUTES.SEARCH_ADVANCED_FILTERS.getRoute());
    };

    const footerContent = (
        <SearchFilterPageFooterButtons
            applyChanges={applyChanges}
            resetChanges={resetChanges}
        />
    );

    const textInputOptions = {
        value: searchTerm,
        label: translate('common.search'),
        onChangeText: setSearchTerm,
        headerMessage: noResultsFound ? translate('common.noResultsFound') : undefined,
    };

    return (
        <SelectionListWithSections
            sections={sections}
            onSelectRow={onSelectItem}
            ListItem={SingleSelectListItem}
            initiallyFocusedItemKey={shouldShowNoneOption ? CONST.SEARCH.NONE_OPTION_ITEM_VALUE : initiallySelectedItem?.value}
            shouldShowTextInput={shouldShowTextInput}
            textInputOptions={textInputOptions}
            footerContent={shouldAutoSave ? undefined : footerContent}
            shouldShowLoadingPlaceholder={!noResultsFound}
            shouldUpdateFocusedIndex
            shouldStopPropagation
        />
    );
}

export default SearchSingleSelectionPicker;
export type {SearchSingleSelectionPickerItem};
