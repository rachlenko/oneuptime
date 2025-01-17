import React, { FunctionComponent, ReactElement } from 'react';
import Image from 'CommonUI/src/Components/Image/Image';
import OneUptimeLogo from 'CommonUI/src/Images/logos/OneUptimePNG/7.png';
import Route from 'Common/Types/API/Route';

export interface ComponentProps {
    onClick: () => void;
}

const Logo: FunctionComponent<ComponentProps> = (
    props: ComponentProps
): ReactElement => {
    return (
        <div className="flex items-center" style={{ marginLeft: '-25px' }}>
            <Image
                height={30}
                onClick={() => {
                    props.onClick && props.onClick();
                }}
                imageUrl={Route.fromString(`${OneUptimeLogo}`)}
            />
        </div>
    );
};

export default Logo;
