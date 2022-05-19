
import { v4 as uuidv4 } from 'uuid';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { FormLoader } from '../basic/Loader';
import ShouldRender from '../basic/ShouldRender';
import { openModal, closeModal } from 'CommonUI/actions/Modal';
import DataPathHoC from '../DataPathHoC';
import DeleteAccount from '../Modals/DeleteAccount';

interface DeleteAccountBoxProps {
    closeModal?: Function;
    openModal: Function;
    deleteAccountSetting?: {
        requesting?: boolean
    };
}

export class DeleteAccountBox extends Component<DeleteAccountBoxProps>{
    public static displayName = '';
    public static propTypes = {};
    constructor(props: $TSFixMe) {
        super(props);
        this.state = { deleteModalId: uuidv4() };
    }

    handleKeyBoard = (e: $TSFixMe) => {
        switch (e.key) {
            case 'Escape':

                return this.props.closeModal({ id: this.state.deleteModalId });
            default:
                return false;
        }
    };

    override render() {

        const { deleteModalId }: $TSFixMe = this.state;

        const deleting: $TSFixMe = this.props.deleteAccountSetting.requesting;

        return (
            <div
                onKeyDown={this.handleKeyBoard}
                className="Box-root Margin-bottom--12"
            >
                <div className="bs-ContentSection Card-root Card-shadow--medium">
                    <div className="Box-root">
                        <div className="bs-ContentSection-content Box-root Box-divider--surface-bottom-1 Flex-flex Flex-alignItems--center Flex-justifyContent--spaceBetween Padding-horizontal--20 Padding-vertical--16">
                            <div className="Box-root">
                                <span className="Text-color--inherit Text-display--inline Text-fontSize--16 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                    <span>Delete Account</span>
                                </span>
                                <p>
                                    <span>
                                        Click the button to permanantly delete
                                        your account.
                                    </span>
                                </p>
                            </div>
                            <div className="bs-ContentSection-footer bs-ContentSection-content Box-root Box-background--white Flex-flex Flex-alignItems--center Flex-justifyContent--spaceBetween Padding-horizontal--0 Padding-vertical--12">
                                <span className="db-SettingsForm-footerMessage"></span>
                                <div>
                                    <button
                                        id="btn_delete_account"
                                        className="bs-Button bs-Button--red Box-background--red"
                                        disabled={deleting}
                                        onClick={() =>

                                            this.props.openModal({
                                                id: deleteModalId,
                                                onClose: () => '',
                                                content: DataPathHoC(
                                                    DeleteAccount,
                                                    {}
                                                ),
                                            })
                                        }
                                    >
                                        <ShouldRender if={!deleting}>
                                            <span>Delete</span>
                                        </ShouldRender>
                                        <ShouldRender if={deleting}>
                                            <FormLoader />
                                        </ShouldRender>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}


DeleteAccountBox.displayName = 'DeleteAccountBox';

const mapDispatchToProps: Function = (dispatch: Dispatch) => bindActionCreators({ openModal, closeModal }, dispatch);

const mapStateToProps: Function = (state: RootState) => {
    return {
        deleteAccountSetting: state.profileSettings.deleteAccount,
    };
};


DeleteAccountBox.propTypes = {
    closeModal: PropTypes.func,
    openModal: PropTypes.func.isRequired,
    deleteAccountSetting: PropTypes.shape({ requesting: PropTypes.bool }),
};

export default connect(mapStateToProps, mapDispatchToProps)(DeleteAccountBox);
