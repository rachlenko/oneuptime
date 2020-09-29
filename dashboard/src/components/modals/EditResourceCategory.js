import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { reduxForm, Field } from 'redux-form';
import { bindActionCreators } from 'redux';
import ShouldRender from '../basic/ShouldRender';
import { Validate } from '../../config';
import { Spinner } from '../basic/Loader';
import { closeModal } from '../../actions/modal';
import { updateResourceCategory } from '../../actions/resourceCategories';

function validate(values) {
    const errors = {};

    if (!Validate.text(values.name)) {
        errors.name = 'Resource Category name can not be empty!';
    }
    return errors;
}

export class EditResourceCategoryForm extends React.Component {
    // eslint-disable-next-line
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        window.addEventListener('keydown', this.handleKeyBoard);
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.handleKeyBoard);
    }

    submitForm = values => {
        const { _id } = this.props.initialValues;
        if (this.props.initialValues.name === values.name) {
            return this.props.closeModal({
                id: this.props.EditResourceCategoryModalId,
            });
        }
        this.props
            .updateResourceCategory(this.props.projectId, _id, values)
            .then(() => {
                return this.props.closeModal({
                    id: this.props.EditResourceCategoryModalId,
                });
            });
    };

    handleKeyBoard = e => {
        switch (e.key) {
            case 'Escape':
                return this.props.closeModal({
                    id: this.props.EditResourceCategoryModalId,
                });
            default:
                return false;
        }
    };

    render() {
        const { handleSubmit } = this.props;

        return (
            <form onSubmit={handleSubmit(this.submitForm.bind(this))}>
                <div className="ModalLayer-wash Box-root Flex-flex Flex-alignItems--flexStart Flex-justifyContent--center">
                    <div
                        className="ModalLayer-contents"
                        tabIndex={-1}
                        style={{ marginTop: 40 }}
                    >
                        <div className="bs-BIM">
                            <div className="bs-Modal bs-Modal--medium">
                                <div className="bs-Modal-header">
                                    <div className="bs-Modal-header-copy">
                                        <span className="Text-color--inherit Text-display--inline Text-fontSize--20 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                            <span>Edit Resource Category</span>
                                        </span>
                                    </div>
                                    <div className="bs-Modal-messages">
                                        <ShouldRender
                                            if={
                                                this.props.resourceCategory
                                                    .error
                                            }
                                        >
                                            <p className="bs-Modal-message">
                                                {
                                                    this.props.resourceCategory
                                                        .error
                                                }
                                            </p>
                                        </ShouldRender>
                                    </div>
                                </div>
                                <div className="bs-Modal-body">
                                    <Field
                                        required={true}
                                        component="input"
                                        name="name"
                                        placeholder="Resource Category Name"
                                        id="resourceCategoryName"
                                        className="bs-TextInput"
                                        style={{
                                            width: '90%',
                                            margin: '10px 0 10px 5%',
                                        }}
                                        disabled={
                                            this.props.resourceCategory
                                                .requesting
                                        }
                                    />
                                </div>
                                <div className="bs-Modal-footer">
                                    <div className="bs-Modal-footer-actions">
                                        <button
                                            className={`bs-Button bs-DeprecatedButton ${this
                                                .props.resourceCategory
                                                .requesting &&
                                                'bs-is-disabled'}`}
                                            type="button"
                                            onClick={() => {
                                                this.props.closeModal({
                                                    id: this.props
                                                        .EditResourceCategoryModalId,
                                                });
                                            }}
                                            disabled={
                                                this.props.resourceCategory
                                                    .requesting
                                            }
                                        >
                                            <span>Cancel</span>
                                        </button>
                                        <button
                                            id="addResourceCategoryButton"
                                            className={`bs-Button bs-DeprecatedButton bs-Button--blue ${this
                                                .props.resourceCategory
                                                .requesting &&
                                                'bs-is-disabled'}`}
                                            type="save"
                                            disabled={
                                                this.props.resourceCategory
                                                    .requesting
                                            }
                                            autoFocus={true}
                                        >
                                            <ShouldRender
                                                if={
                                                    this.props.resourceCategory
                                                        .requesting
                                                }
                                            >
                                                <Spinner />
                                            </ShouldRender>
                                            <span>Update</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        );
    }
}

EditResourceCategoryForm.displayName = 'EditResourceCategoryForm';

const UpdateResourceCategoryForm = reduxForm({
    form: 'EditResourceCategoryForm',
    validate,
})(EditResourceCategoryForm);

const mapStateToProps = (state, ownProps) => {
    return {
        projectId:
            state.project.currentProject !== null &&
            state.project.currentProject._id,
        EditResourceCategoryModalId: state.modal.modals[0].id,
        resourceCategory: state.resourceCategories.updatedResourceCategory,
        initialValues: state.resourceCategories.resourceCategoryList
            ? state.resourceCategories.resourceCategoryList.resourceCategories.filter(
                  obj => obj._id === ownProps.data.resourceCategoryId
              )[0]
            : {},
    };
};

const mapDispatchToProps = dispatch => {
    return bindActionCreators({ closeModal, updateResourceCategory }, dispatch);
};

EditResourceCategoryForm.propTypes = {
    handleSubmit: PropTypes.func.isRequired,
    closeModal: PropTypes.func.isRequired,
    projectId: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    updateResourceCategory: PropTypes.func.isRequired,
    EditResourceCategoryModalId: PropTypes.string,
    resourceCategory: PropTypes.object,
    initialValues: PropTypes.object,
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(UpdateResourceCategoryForm);