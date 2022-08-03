import Route from 'Common/Types/API/Route';
import Page from 'CommonUI/src/Components/Page/Page';
import React, { FunctionComponent, ReactElement } from 'react';
import PageMap from '../../Utils/PageMap';
import RouteMap from '../../Utils/RouteMap';
import PageComponentProps from '../PageComponentProps';
import DashboardSideMenu from './SideMenu';
import ModelTable from 'CommonUI/src/Components/ModelTable/ModelTable';
import TableColumnType from 'CommonUI/src/Components/Table/Types/TableColumnType';
import FormFieldSchemaType from 'CommonUI/src/Components/Forms/Types/FormFieldSchemaType';
import { IconProp } from 'CommonUI/src/Components/Icon/Icon';
import CardModelDetail from 'CommonUI/src/Components/ModelDetail/CardModelDetail';
import Team from 'Common/Models/Team';
import TeamMember from 'Common/Models/TeamMember';
import Navigation from 'CommonUI/src/Utils/Navigation';
import PermissionUtil from 'CommonUI/src/Utils/Permission';
import Label from 'Common/Models/Label';
import { JSONObject } from 'Common/Types/JSON';
import Permission, { PermissionHelper } from 'Common/Types/Permission';
import ModelDelete from 'CommonUI/src/Components/ModelDelete/ModelDelete';
import ObjectID from 'Common/Types/ObjectID';
import Pill from 'CommonUI/src/Components/Pill/Pill';
import Color from 'Common/Types/Color';
import TeamPermission from 'Common/Models/TeamPermission';

const TeamView: FunctionComponent<PageComponentProps> = (
    props: PageComponentProps
): ReactElement => {
    return (
        <Page
            title={'Project Settings'}
            breadcrumbLinks={[
                {
                    title: 'Project',
                    to: RouteMap[PageMap.HOME] as Route,
                },
                {
                    title: 'Settings',
                    to: RouteMap[PageMap.SETTINGS] as Route,
                },
                {
                    title: 'Teams',
                    to: RouteMap[PageMap.SETTINGS_TEAMS] as Route,
                },
                {
                    title: 'View Team',
                    to: RouteMap[PageMap.SETTINGS_TEAM_VIEW] as Route,
                },
            ]}
            sideMenu={<DashboardSideMenu />}
        >
            {/* API Key View  */}
            <CardModelDetail
                cardProps={{
                    title: 'Team Details',
                    description: "Here's more details on this team.",
                    icon: IconProp.User,
                }}
                isEditable={true}
                formFields={[
                    {
                        field: {
                            name: true,
                        },
                        title: 'Name',
                        fieldType: FormFieldSchemaType.Text,
                        required: true,
                        placeholder: 'Team Name',
                        validation: {
                            noSpaces: true,
                            minLength: 2,
                        },
                    },
                    {
                        field: {
                            description: true,
                        },
                        title: 'Description',
                        fieldType: FormFieldSchemaType.LongText,
                        required: true,
                        placeholder: 'Team Description',
                    },
                ]}
                modelDetailProps={{
                    type: Team,
                    model: new Team(),
                    id: 'model-detail-team',
                    fields: [
                        {
                            field: {
                                name: true,
                            },
                            title: 'Name',
                        },
                        {
                            field: {
                                description: true,
                            },
                            title: 'Description',
                        },
                    ],
                    modelId: Navigation.getLastParam(),
                }}
            />

            {/* Team Members Table */}

            <ModelTable<TeamMember>
                type={TeamMember}
                model={new TeamMember()}
                id="table-team-member"
                isDeleteable={true}
                isEditable={true}
                isCreateable={true}
                isViewable={false}
                cardProps={{
                    icon: IconProp.User,
                    title: 'Team Members',
                    description:
                        'See a list of members or invite them to this team. ',
                }}
                noItemsMessage={'No members found for this team.'}
                formFields={[
                    {
                        field: {
                            user: true,
                        },
                        title: 'User Email',
                        description:
                            'Please enter the email of the user you would like to invite.',
                        fieldType: FormFieldSchemaType.Email,
                        required: false,
                        placeholder: 'member@company.com',
                    },
                ]}
                showRefreshButton={true}
                showFilterButton={true}
                currentPageRoute={props.pageRoute}
                columns={[
                    {
                        field: {
                            user: true,
                        },
                        title: 'User',
                        type: TableColumnType.Text,
                        getColumnElement: (item: JSONObject): ReactElement => {
                            if (item['user']) {
                                if (
                                    item['user'] &&
                                    (item['user'] as JSONObject)['name'] &&
                                    (item['user'] as JSONObject)['name']
                                ) {
                                    return (
                                        <p>
                                            {((item['user'] as JSONObject)[
                                                'name'
                                            ] as string) || ''}
                                        </p>
                                    );
                                }
                            }

                            return <></>;
                        },
                    },
                ]}
            />

            {/* Team Permisison Table */}

            <ModelTable<TeamPermission>
                type={TeamPermission}
                model={new TeamPermission()}
                id="table-team-permission"
                isDeleteable={true}
                isEditable={true}
                isCreateable={true}
                isViewable={false}
                cardProps={{
                    icon: IconProp.Lock,
                    title: 'Team Permissions',
                    description:
                        'Add different permisisons to this team to make it more granular.',
                }}
                noItemsMessage={'No permisisons created for this team so far.'}
                formFields={[
                    {
                        field: {
                            permission: true,
                        },
                        title: 'Permission',
                        fieldType: FormFieldSchemaType.Dropdown,
                        required: true,
                        placeholder: 'Permission',
                        dropdownOptions:
                            PermissionUtil.projectPermissionsAsDropdownOptions(),
                    },
                    {
                        field: {
                            labels: true,
                        },
                        title: 'Labels (Optional)',
                        description:
                            'Labels on which this permissions will apply on. This is optional and an advanced feature.',
                        fieldType: FormFieldSchemaType.MultiSelectDropdown,
                        dropdownModal: {
                            type: Label,
                            labelField: 'name',
                            valueField: '_id',
                        },
                        required: false,
                        placeholder: 'Labels',
                    },
                ]}
                showRefreshButton={true}
                showFilterButton={true}
                currentPageRoute={props.pageRoute}
                columns={[
                    {
                        field: {
                            permission: true,
                        },
                        title: 'Permission',
                        type: TableColumnType.Text,
                        isFilterable: true,
                        getColumnElement: (item: JSONObject): ReactElement => {
                            return (
                                <p>
                                    {PermissionHelper.getTitle(
                                        item['permission'] as Permission
                                    )}
                                </p>
                            );
                        },
                    },
                    {
                        field: {
                            labels: true,
                        },
                        title: 'Labels',
                        type: TableColumnType.Text,
                        getColumnElement: (item: JSONObject): ReactElement => {
                            const returnElements: Array<ReactElement> = [];
                            if (
                                item['labels'] &&
                                Array.isArray(item['labels'])
                            ) {
                                let counter: number = 0;
                                for (const label of item['labels']) {
                                    if (
                                        label &&
                                        (label as JSONObject)['color'] &&
                                        (label as JSONObject)['name']
                                    ) {
                                        returnElements.push(
                                            <Pill
                                                key={counter}
                                                color={
                                                    (label as JSONObject)[
                                                        'color'
                                                    ] as Color
                                                }
                                                text={
                                                    (label as JSONObject)[
                                                        'name'
                                                    ] as string
                                                }
                                                style={{
                                                    marginRight: '5px',
                                                }}
                                            />
                                        );

                                        counter++;
                                    }
                                }
                            }

                            return <>{returnElements}</>;
                        },
                    },
                ]}
            />

            <ModelDelete
                type={Team}
                modelId={
                    new ObjectID(Navigation.getLastParam()?.toString() || '')
                }
                onDeleteSuccess={() => {
                    Navigation.navigate(
                        RouteMap[PageMap.SETTINGS_TEAMS] as Route
                    );
                }}
            />
        </Page>
    );
};

export default TeamView;