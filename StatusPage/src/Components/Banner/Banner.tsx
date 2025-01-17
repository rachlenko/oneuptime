import React, { FunctionComponent, ReactElement } from 'react';
import Image from 'CommonUI/src/Components/Image/Image';
import File from 'Model/Models/File';

export interface ComponentProps {
    onClick?: () => void | undefined;
    file: File;
}

const Banner: FunctionComponent<ComponentProps> = (
    props: ComponentProps
): ReactElement => {
    return (
        <div className="flex items-center">
            <Image
                onClick={() => {
                    props.onClick && props.onClick();
                }}
                file={props.file}
            />
        </div>
    );
};

export default Banner;
