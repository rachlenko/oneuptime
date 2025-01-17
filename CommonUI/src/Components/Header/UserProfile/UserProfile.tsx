import URL from 'Common/Types/API/URL';
import Name from 'Common/Types/Name';
import React, { FunctionComponent, ReactElement } from 'react';
import Icon, { IconProp } from '../../Icon/Icon';
import useComponentOutsideClick from '../../../Types/UseComponentOutsideClick';
import Route from 'Common/Types/API/Route';
import Image from '../../Image/Image';

export interface ComponentProps {
    userFullName: Name;
    children: ReactElement | Array<ReactElement>;
    userProfilePicture: URL | Route;
}

const UserProfile: FunctionComponent<ComponentProps> = (
    props: ComponentProps
): ReactElement => {
    const { ref, isComponentVisible, setIsComponentVisible } =
        useComponentOutsideClick(false);

    return (
        <div className="d-inline-block dropdown">
            <button
                onClick={() => {
                    setIsComponentVisible(!isComponentVisible);
                }}
                id="page-header-user-dropdown"
                aria-haspopup="true"
                className="btn header-item bg-soft-light border-start border-end flex"
                aria-expanded="false"
                style={{
                    alignItems: 'center',
                }}
            >
                <Image
                    className="rounded-circle header-profile-user"
                    imageUrl={props.userProfilePicture}
                />

                <span className="d-none d-xl-inline-block ms-2 me-1">
                    {props.userFullName.toString()}
                </span>
                <Icon icon={IconProp.ChevronDown} />
            </button>
            <div ref={ref}>{isComponentVisible && props.children}</div>
        </div>
    );
};

export default UserProfile;
