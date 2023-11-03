import React, { useEffect, useCallback, useState, createContext, useRef } from 'react';
import PropTypes from 'prop-types';

import '../../../../../../../../../public/assets/ibexa/build/ibexa-admin-ui-layout-css.css';

import Icon from '../common/icon/icon';
import deepClone from '../common/helpers/deep.clone.helper';
import { createCssClassNames } from '../common/helpers/css.class.names';
import { useLoadedLocationsReducer } from './hooks/useLoadedLocationsReducer';
import { useSelectedLocationsReducer } from './hooks/useSelectedLocationsReducer';
import {
    loadAccordionData,
    loadContentTypes,
    findLocationsById,
    loadContentInfo,
    loadLocationsWithPermissions,
} from './services/universal.discovery.service';
import {
    parse as parseTooltips,
    hideAll as hideAllTooltips,
} from '@ibexa-admin-ui/src/bundle/Resources/public/js/scripts/helpers/tooltips.helper';

const { document } = window;

const CLASS_SCROLL_DISABLED = 'ibexa-scroll-disabled';

let TranslatorInstance = null;

export const setTranslator = (fechedTranslatorInstance) => TranslatorInstance = fechedTranslatorInstance;
export const getTranslator = () => TranslatorInstance;

//missing Translator
export const SORTING_OPTIONS = [
    {
        value: 'date:asc',
        label: (
            <div className="c-simple-dropdown__option-label">
                Date
                <Icon name="back" extraClasses="c-simple-dropdown__arrow-down ibexa-icon--tiny-small" />
            </div>
        ),
        selectedLabel: (
            <div className="c-simple-dropdown__option-label">
                Sort by date
                <Icon name="back" extraClasses="c-simple-dropdown__arrow-down ibexa-icon--tiny-small" />
            </div>
        ),
        sortClause: 'DatePublished',
        sortOrder: 'ascending',
    },
    {
        value: 'date:desc',
        label: (
            <div className="c-simple-dropdown__option-label">
                Date
                <Icon name="back" extraClasses="c-simple-dropdown__arrow-up ibexa-icon--tiny-small" />
            </div>
        ),
        selectedLabel: (
            <div className="c-simple-dropdown__option-label">
                Sort by date
                <Icon name="back" extraClasses="c-simple-dropdown__arrow-up ibexa-icon--tiny-small" />
            </div>
        ),
        sortClause: 'DatePublished',
        sortOrder: 'descending',
    },
    {
        value: 'name:asc',
        label: 'Name A-Z',
        selectedLabel: 'Sort by name A-Z',
        sortClause: 'ContentName',
        sortOrder: 'ascending',
    },
    {
        value: 'name:desc',
        label: 'Name Z-A',
        selectedLabel: 'Sort by name Z-A',
        sortClause: 'ContentName',
        sortOrder: 'descending',
    },
];

//missing Translator
export const VIEWS = [
    {
        value: 'finder',
        iconName: 'panels',
        label: 'Panels view',
    },
    {
        value: 'grid',
        iconName: 'view-grid',
        label: 'Grid view',
    },
    {
        value: 'tree',
        iconName: 'content-tree',
        label: 'Tree view',
    },
];

const defaultRestInfo = {
    token: document.querySelector('meta[name="CSRF-Token"]')?.content,
    siteaccess: document.querySelector('meta[name="SiteAccess"]')?.content,
};

export const UDWContext = createContext();
export const RestInfoContext = createContext();
export const AllowRedirectsContext = createContext();
export const AllowConfirmationContext = createContext();
export const ConfigContext = createContext();
export const RoutingContext = createContext();
export const TranslatorContext = createContext();
export const ContentTypesMapContext = createContext();
export const ContentTypesInfoMapContext = createContext();
export const MultipleConfigContext = createContext();
export const ContainersOnlyContext = createContext();
export const AllowedContentTypesContext = createContext();
export const ActiveTabContext = createContext();
export const TabsConfigContext = createContext();
export const TabsContext = createContext();
export const TitleContext = createContext();
export const CancelContext = createContext();
export const ConfirmContext = createContext();
export const SortingContext = createContext();
export const SortOrderContext = createContext();
export const CurrentViewContext = createContext();
export const MarkedLocationIdContext = createContext();
export const LoadedLocationsMapContext = createContext();
export const RootLocationIdContext = createContext();
export const SelectedLocationsContext = createContext();
export const CreateContentWidgetContext = createContext();
export const ContentOnTheFlyDataContext = createContext();
export const ContentOnTheFlyConfigContext = createContext();
export const EditOnTheFlyDataContext = createContext();
export const BlockFetchLocationHookContext = createContext();
export const SearchTextContext = createContext();
export const DropdownPortalRefContext = createContext();

const UniversalDiscoveryModule = (props) => {
    const { restInfo, adminUiConfig, Routing } = props;
    const { tabs: tabsWithPriority } = adminUiConfig.universalDiscoveryWidget;
    const tabs = tabsWithPriority.reduce((tabsPrioritized, tabToAdd) => {
        const tabWithSameIdIndex = tabsPrioritized.findIndex((tab) => tab.id === tabToAdd.id);

        if (tabWithSameIdIndex === -1) {
            tabsPrioritized.push(tabToAdd);
        } else {
            const currentTabPriority = tabsPrioritized[tabWithSameIdIndex].priority ?? -1;
            const tabToAddPriority = tabToAdd.priority ?? -1;

            if (currentTabPriority < tabToAddPriority) {
                tabsPrioritized[tabWithSameIdIndex] = tabToAdd;
            }
        }

        return tabsPrioritized;
    }, []);
    const defaultMarkedLocationId = props.startingLocationId || props.rootLocationId;
    const abortControllerRef = useRef();
    const dropdownPortalRef = useRef();
    const [activeTab, setActiveTab] = useState(props.activeTab);
    const [sorting, setSorting] = useState(props.activeSortClause);
    const [sortOrder, setSortOrder] = useState(props.activeSortOrder);
    const [currentView, setCurrentView] = useState(props.activeView);
    const [markedLocationId, setMarkedLocationId] = useState(defaultMarkedLocationId !== 1 ? defaultMarkedLocationId : null);
    const [createContentVisible, setCreateContentVisible] = useState(false);
    const [contentOnTheFlyData, setContentOnTheFlyData] = useState({});
    const [editOnTheFlyData, setEditOnTheFlyData] = useState({});
    const [contentTypesInfoMap, setContentTypesInfoMap] = useState({});
    const [isFetchLocationHookBlocked, setIsFetchLocationHookBlocked] = useState(
        props.startingLocationId && props.startingLocationId !== 1 && props.startingLocationId !== props.rootLocationId,
    );
    const [searchText, setSearchText] = useState('');
    const [loadedLocationsMap, dispatchLoadedLocationsAction] = useLoadedLocationsReducer([
        { parentLocationId: props.rootLocationId, subitems: [] },
    ]);
    const [selectedLocations, dispatchSelectedLocationsAction] = useSelectedLocationsReducer();
    const activeTabConfig = tabs.find((tab) => tab.id === activeTab);
    const Tab = activeTabConfig.component;
    const className = createCssClassNames({
        'm-ud': true,
        'm-ud--locations-selected': !!selectedLocations.length && props.allowConfirmation,
    });
    const loadPermissions = () => {
        const locationIds = selectedLocations
            .filter((item) => !item.permissions)
            .map((item) => item.location.id)
            .join(',');

        if (!locationIds) {
            return Promise.resolve([]);
        }

        return new Promise((resolve) => {
            loadLocationsWithPermissions({ locationIds, signal: abortControllerRef.current.signal }, (response) => resolve(response));
        });
    };
    const loadVersions = (signal = null) => {
        const locationsWithoutVersion = selectedLocations.filter(
            (selectedItem) => !selectedItem.location.ContentInfo.Content.CurrentVersion.Version,
        );

        if (!locationsWithoutVersion.length) {
            return Promise.resolve([]);
        }

        const contentId = locationsWithoutVersion.map((item) => item.location.ContentInfo.Content._id).join(',');

        return new Promise((resolve) => {
            loadContentInfo({ ...restInfo, contentId, signal }, (response) => resolve(response));
        });
    };
    const contentTypesMapGlobal = Object.values(adminUiConfig.contentTypes).reduce((contentTypesMap, contentTypesGroup) => {
        contentTypesGroup.forEach((contentType) => {
            contentTypesMap[contentType.href] = contentType;
        });

        return contentTypesMap;
    }, {});
    const onConfirm = useCallback(
        (selectedItems = selectedLocations) => {
            loadVersions().then((locationsWithVersions) => {
                const clonedSelectedLocation = deepClone(selectedItems);

                if (Array.isArray(locationsWithVersions)) {
                    locationsWithVersions.forEach((content) => {
                        const clonedLocation = clonedSelectedLocation.find(
                            (clonedItem) => clonedItem.location.ContentInfo.Content._id === content._id,
                        );

                        if (clonedLocation) {
                            clonedLocation.location.ContentInfo.Content.CurrentVersion.Version = content.CurrentVersion.Version;
                        }
                    });
                }

                const updatedLocations = clonedSelectedLocation.map((selectedItem) => {
                    const clonedLocation = deepClone(selectedItem.location);
                    const contentType = clonedLocation.ContentInfo.Content.ContentType;

                    clonedLocation.ContentInfo.Content.ContentTypeInfo = contentTypesInfoMap[contentType._href];

                    return clonedLocation;
                });

                props.onConfirm(updatedLocations);
            });
        },
        [selectedLocations, contentTypesInfoMap],
    );

    useEffect(() => {
        const addContentTypesInfo = (contentTypes) => {
            setContentTypesInfoMap((prevState) => ({ ...prevState, ...contentTypes }));
        };
        const handleLoadContentTypes = (response) => {
            const contentTypesMap = response.ContentTypeInfoList.ContentType.reduce((contentTypesList, item) => {
                contentTypesList[item._href] = item;

                return contentTypesList;
            }, {});

            addContentTypesInfo(contentTypesMap);
        };

        adminUiConfig.universalDiscoveryWidget.contentTypesLoaders?.forEach((contentTypesLoader) =>
            contentTypesLoader(addContentTypesInfo),
        );

        loadContentTypes(restInfo, handleLoadContentTypes);
        document.body.dispatchEvent(new CustomEvent('ibexa-udw-opened'));
        parseTooltips(document.querySelector('.c-udw-tab'));

        return () => {
            document.body.dispatchEvent(new CustomEvent('ibexa-udw-closed'));
            hideAllTooltips();
        };
    }, []);

    useEffect(() => {
        if (!props.selectedLocations.length) {
            return;
        }

        findLocationsById({ ...restInfo, id: props.selectedLocations.join(','), limit: props.selectedLocations.length }, (locations) => {
            const mappedLocation = props.selectedLocations.map((locationId) => {
                const location = locations.find(({ id }) => id === parseInt(locationId, 10));

                return { location };
            });

            dispatchSelectedLocationsAction({ type: 'REPLACE_SELECTED_LOCATIONS', locations: mappedLocation });
        });
    }, [props.selectedLocations]);

    useEffect(() => {
        abortControllerRef.current?.abort();

        abortControllerRef.current = new AbortController();

        Promise.all([loadPermissions(), loadVersions(abortControllerRef.current.signal)]).then((response) => {
            const [locationsWithPermissions, locationsWithVersions] = response;

            if (!locationsWithPermissions.length && !locationsWithVersions.length) {
                return;
            }

            const clonedSelectedLocation = deepClone(selectedLocations);

            locationsWithPermissions.forEach((item) => {
                const locationWithoutPermissions = clonedSelectedLocation.find(
                    (selectedItem) => selectedItem.location.id === item.location.Location.id,
                );

                if (locationWithoutPermissions) {
                    locationWithoutPermissions.permissions = item.permissions;
                }
            });

            locationsWithVersions.forEach((content) => {
                const clonedLocation = clonedSelectedLocation.find(
                    (clonedItem) => clonedItem.location.ContentInfo.Content._id === content._id,
                );

                if (clonedLocation) {
                    clonedLocation.location.ContentInfo.Content.CurrentVersion.Version = content.CurrentVersion.Version;
                }
            });

            dispatchSelectedLocationsAction({
                type: 'REPLACE_SELECTED_LOCATIONS',
                locations: clonedSelectedLocation,
            });
        });

        return () => {
            abortControllerRef.current?.abort();
        };
    }, [selectedLocations]);

    useEffect(() => {
        document.body.classList.add(CLASS_SCROLL_DISABLED);

        return () => {
            document.body.classList.remove(CLASS_SCROLL_DISABLED);
        };
    });

    useEffect(() => {
        if (currentView === 'grid') {
            loadedLocationsMap[loadedLocationsMap.length - 1].subitems = [];

            dispatchLoadedLocationsAction({ type: 'SET_LOCATIONS', data: loadedLocationsMap });
        } else if (
            (currentView === 'finder' || currentView === 'tree') &&
            !!markedLocationId &&
            markedLocationId !== loadedLocationsMap[loadedLocationsMap.length - 1].parentLocationId &&
            loadedLocationsMap[loadedLocationsMap.length - 1].subitems.find((subitem) => subitem.location.id === markedLocationId)
        ) {
            dispatchLoadedLocationsAction({ type: 'UPDATE_LOCATIONS', data: { parentLocationId: markedLocationId, subitems: [] } });
        }
    }, [currentView]);

    useEffect(() => {
        if (!props.startingLocationId || props.startingLocationId === 1 || props.startingLocationId === props.rootLocationId) {
            return;
        }

        loadAccordionData(
            {
                ...restInfo,
                parentLocationId: props.startingLocationId,
                sortClause: sorting,
                sortOrder: sortOrder,
                gridView: currentView === 'grid',
                rootLocationId: props.rootLocationId,
            },
            (locationsMap) => {
                dispatchLoadedLocationsAction({ type: 'SET_LOCATIONS', data: locationsMap });
                setMarkedLocationId(props.startingLocationId);
                setIsFetchLocationHookBlocked(false);
            },
        );
    }, [props.startingLocationId]);

    useEffect(() => {
        const locationsMap = loadedLocationsMap.map((loadedLocation) => {
            loadedLocation.subitems = [];

            return loadedLocation;
        });

        dispatchLoadedLocationsAction({ type: 'SET_LOCATIONS', data: locationsMap });
    }, [sorting, sortOrder]);

    return (
        <div className={className}>
            <UDWContext.Provider value={true}>
                <TranslatorContext.Provider value={Translator}>
                    <RoutingContext.Provider value={Routing}>
                        <RestInfoContext.Provider value={restInfo}>
                            <ConfigContext.Provider value={adminUiConfig}>
                                <BlockFetchLocationHookContext.Provider value={[isFetchLocationHookBlocked, setIsFetchLocationHookBlocked]}>
                                    <AllowRedirectsContext.Provider value={props.allowRedirects}>
                                        <AllowConfirmationContext.Provider value={props.allowConfirmation}>
                                            <ContentTypesInfoMapContext.Provider value={contentTypesInfoMap}>
                                                <ContentTypesMapContext.Provider value={contentTypesMapGlobal}>
                                                    <MultipleConfigContext.Provider value={[props.multiple, props.multipleItemsLimit]}>
                                                        <ContainersOnlyContext.Provider value={props.containersOnly}>
                                                            <AllowedContentTypesContext.Provider value={props.allowedContentTypes}>
                                                                <ActiveTabContext.Provider value={[activeTab, setActiveTab]}>
                                                                    <TabsContext.Provider value={tabs}>
                                                                        <TabsConfigContext.Provider value={props.tabsConfig}>
                                                                            <TitleContext.Provider value={props.title}>
                                                                                <CancelContext.Provider value={props.onCancel}>
                                                                                    <ConfirmContext.Provider value={onConfirm}>
                                                                                        <SortingContext.Provider
                                                                                            value={[sorting, setSorting]}
                                                                                        >
                                                                                            <SortOrderContext.Provider
                                                                                                value={[sortOrder, setSortOrder]}
                                                                                            >
                                                                                                <CurrentViewContext.Provider
                                                                                                    value={[currentView, setCurrentView]}
                                                                                                >
                                                                                                    <MarkedLocationIdContext.Provider
                                                                                                        value={[
                                                                                                            markedLocationId,
                                                                                                            setMarkedLocationId,
                                                                                                        ]}
                                                                                                    >
                                                                                                        <LoadedLocationsMapContext.Provider
                                                                                                            value={[
                                                                                                                loadedLocationsMap,
                                                                                                                dispatchLoadedLocationsAction,
                                                                                                            ]}
                                                                                                        >
                                                                                                            <RootLocationIdContext.Provider
                                                                                                                value={props.rootLocationId}
                                                                                                            >
                                                                                                                <SelectedLocationsContext.Provider
                                                                                                                    value={[
                                                                                                                        selectedLocations,
                                                                                                                        dispatchSelectedLocationsAction,
                                                                                                                    ]}
                                                                                                                >
                                                                                                                    <CreateContentWidgetContext.Provider
                                                                                                                        value={[
                                                                                                                            createContentVisible,
                                                                                                                            setCreateContentVisible,
                                                                                                                        ]}
                                                                                                                    >
                                                                                                                        <ContentOnTheFlyDataContext.Provider
                                                                                                                            value={[
                                                                                                                                contentOnTheFlyData,
                                                                                                                                setContentOnTheFlyData,
                                                                                                                            ]}
                                                                                                                        >
                                                                                                                            <ContentOnTheFlyConfigContext.Provider
                                                                                                                                value={
                                                                                                                                    props.contentOnTheFly
                                                                                                                                }
                                                                                                                            >
                                                                                                                                <EditOnTheFlyDataContext.Provider
                                                                                                                                    value={[
                                                                                                                                        editOnTheFlyData,
                                                                                                                                        setEditOnTheFlyData,
                                                                                                                                    ]}
                                                                                                                                >
                                                                                                                                    <SearchTextContext.Provider
                                                                                                                                        value={[
                                                                                                                                            searchText,
                                                                                                                                            setSearchText,
                                                                                                                                        ]}
                                                                                                                                    >
                                                                                                                                        <DropdownPortalRefContext.Provider
                                                                                                                                            value={
                                                                                                                                                dropdownPortalRef
                                                                                                                                            }
                                                                                                                                        >
                                                                                                                                            <Tab />
                                                                                                                                        </DropdownPortalRefContext.Provider>
                                                                                                                                    </SearchTextContext.Provider>
                                                                                                                                </EditOnTheFlyDataContext.Provider>
                                                                                                                            </ContentOnTheFlyConfigContext.Provider>
                                                                                                                        </ContentOnTheFlyDataContext.Provider>
                                                                                                                    </CreateContentWidgetContext.Provider>
                                                                                                                </SelectedLocationsContext.Provider>
                                                                                                            </RootLocationIdContext.Provider>
                                                                                                        </LoadedLocationsMapContext.Provider>
                                                                                                    </MarkedLocationIdContext.Provider>
                                                                                                </CurrentViewContext.Provider>
                                                                                            </SortOrderContext.Provider>
                                                                                        </SortingContext.Provider>
                                                                                    </ConfirmContext.Provider>
                                                                                </CancelContext.Provider>
                                                                            </TitleContext.Provider>
                                                                        </TabsConfigContext.Provider>
                                                                    </TabsContext.Provider>
                                                                </ActiveTabContext.Provider>
                                                            </AllowedContentTypesContext.Provider>
                                                        </ContainersOnlyContext.Provider>
                                                    </MultipleConfigContext.Provider>
                                                </ContentTypesMapContext.Provider>
                                            </ContentTypesInfoMapContext.Provider>
                                        </AllowConfirmationContext.Provider>
                                    </AllowRedirectsContext.Provider>
                                </BlockFetchLocationHookContext.Provider>
                            </ConfigContext.Provider>
                        </RestInfoContext.Provider>
                    </RoutingContext.Provider>
                </TranslatorContext.Provider>
            </UDWContext.Provider>
        </div>
    );
    /* eslint-enable max-len */
};

UniversalDiscoveryModule.propTypes = {
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    activeTab: PropTypes.string,
    rootLocationId: PropTypes.number,
    startingLocationId: PropTypes.number,
    multiple: PropTypes.bool,
    multipleItemsLimit: PropTypes.number,
    containersOnly: PropTypes.bool,
    allowedContentTypes: PropTypes.array.isRequired,
    activeSortClause: PropTypes.string,
    activeSortOrder: PropTypes.string,
    activeView: PropTypes.string,
    contentOnTheFly: PropTypes.shape({
        allowedLanguages: PropTypes.array.isRequired,
        allowedLocations: PropTypes.array.isRequired,
        preselectedLocation: PropTypes.string.isRequired,
        preselectedContentType: PropTypes.string.isRequired,
        hidden: PropTypes.bool.isRequired,
        autoConfirmAfterPublish: PropTypes.bool.isRequired,
    }).isRequired,
    tabsConfig: PropTypes.objectOf(
        PropTypes.shape({
            itemsPerPage: PropTypes.number.isRequired,
            priority: PropTypes.number.isRequired,
            hidden: PropTypes.bool.isRequired,
        }),
    ).isRequired,
    selectedLocations: PropTypes.array,
    allowRedirects: PropTypes.bool.isRequired,
    allowConfirmation: PropTypes.bool.isRequired,
    restInfo: PropTypes.shape({
        token: PropTypes.string.isRequired,
        siteaccess: PropTypes.string.isRequired,
    }),
    adminUiConfig: PropTypes.object,
    Routing: PropTypes.object,
    Translator: PropTypes.object,
};

UniversalDiscoveryModule.defaultProps = {
    activeTab: 'browse',
    rootLocationId: 1,
    startingLocationId: null,
    multiple: false,
    multipleItemsLimit: 1,
    containersOnly: false,
    activeSortClause: 'date',
    activeSortOrder: 'ascending',
    activeView: 'finder',
    selectedLocations: [],
    restInfo: defaultRestInfo,
    adminUiConfig: window.ibexa?.adminUiConfig,
    Routing: window.Routing,
    Translator: window.Translator,
};

export default UniversalDiscoveryModule;
