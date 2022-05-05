import { Column, Entity } from 'typeorm';
import BaseModel from './BaseModel';
import EncryptedColumn from '../Types/Database/EncryptedColumnDecorator';
import ColumnType from '../Types/Database/ColumnType';
import ColumnLength from '../Types/Database/ColumnLength';
import RequiredColumn from '../Types/Database/RequiredColumnDecorator';
import UniqueColumn from '../Types/Database/UniqueColumnDecorator';
import SlugifyColumn from '../Types/Database/SlugifyColumnDecorator';
import Phone from '../Types/Phone';
import Email from '../Types/Email';
import Name from '../Types/Name';
import URL from '../Types/API/URL';
import Timezone from '../Types/Timezone';

@SlugifyColumn('name', 'slug')
@Entity({
    name: 'User',
})
class User extends BaseModel {
    @RequiredColumn()
    @Column({
        type: ColumnType.Name,
        length: ColumnLength.Name,
        nullable: false,
    })
    public name!: Name;

    @UniqueColumn()
    @RequiredColumn()
    @Column({
        type: ColumnType.Email,
        length: ColumnLength.Email,
        unique: true,
        nullable: false,
    })
    public email!: Email;

    @Column({
        type: ColumnType.Email,
        length: ColumnLength.Email,
        unique: false,
        nullable: true,
    })
    public newUnverifiedTemporaryEmail?: string;

    @EncryptedColumn()
    @Column({
        type: ColumnType.Password,
        length: ColumnLength.Password,
        unique: false,
        nullable: true,
    })
    public password?: string;

    @Column({
        type: ColumnType.Boolean,
        default: false,
    })
    public isEmailVerified!: boolean;

    @RequiredColumn()
    @Column({
        type: ColumnType.Name,
        length: ColumnLength.Name,
        nullable: false,
        unique: false,
    })
    public companyName!: string;

    @RequiredColumn()
    @Column({
        type: ColumnType.ShortText,
        length: ColumnLength.ShortText,
        nullable: false,
        unique: false,
    })
    public companyRole!: string;

    @RequiredColumn()
    @Column({
        type: ColumnType.ShortText,
        length: ColumnLength.ShortText,
        nullable: false,
        unique: false,
    })
    public companySize!: string;

    @Column({
        type: ColumnType.ShortText,
        length: ColumnLength.ShortText,
        nullable: true,
        unique: false,
    })
    public referral?: string;

    @RequiredColumn()
    @Column({
        type: ColumnType.Phone,
        length: ColumnLength.Phone,
        nullable: false,
        unique: false,
    })
    public companyPhoneNumber!: Phone;

    @Column({
        type: ColumnType.ShortURL,
        length: ColumnLength.ShortURL,
        nullable: true,
        unique: false,
        transformer: URL.getDatabaseTransformer(),
    })
    public profilePicImageUrl?: URL;

    @RequiredColumn()
    @Column({
        type: ColumnType.Boolean,
        default: false,
        nullable: false,
        unique: false,
    })
    public twoFactorAuthEnabled!: boolean;

    @Column({
        type: ColumnType.ShortText,
        length: ColumnLength.ShortText,
        nullable: true,
        unique: false,
    })
    public twoFactorSecretCode?: string;

    @Column({
        type: ColumnType.LongURL,
        length: ColumnLength.LongURL,
        nullable: true,
        unique: false,
        transformer: URL.getDatabaseTransformer(),
    })
    public otpAuthUrl?: URL;

    @Column({
        type: ColumnType.Array,
        nullable: true,
        unique: false,
    })
    public backupCodes?: Array<string>;

    @Column({
        type: ColumnType.ShortText,
        length: ColumnLength.ShortText,
        nullable: true,
        unique: false,
    })
    public jwtRefreshToken?: string;

    @Column({
        type: ColumnType.ShortText,
        length: ColumnLength.ShortText,
        nullable: true,
        unique: false,
    })
    public paymentProviderCustomerId?: string;

    @Column({
        type: ColumnType.ShortText,
        length: ColumnLength.ShortText,
        nullable: true,
        unique: false,
    })
    public resetPasswordToken!: string;

    @Column({
        type: ColumnType.Date,
        nullable: true,
        unique: false,
    })
    public resetPasswordExpires?: Date;

    @Column({
        type: ColumnType.ShortText,
        length: ColumnLength.ShortText,
        nullable: true,
        unique: false,
    })
    public timezone?: Timezone;

    @RequiredColumn()
    @Column({
        type: ColumnType.Date,
        nullable: false,
        unique: false,
    })
    public lastActive!: Date;

    @Column({
        type: ColumnType.ShortText,
        length: ColumnLength.ShortText,
        nullable: true,
        unique: false,
    })
    public promotionName!: string;

    @RequiredColumn()
    @Column({
        type: ColumnType.Boolean,
        nullable: false,
        unique: false,
        default: false,
    })
    public disabled!: boolean;

    @Column({
        type: ColumnType.Date,
        nullable: true,
        unique: false,
    })
    public paymentFailedDate!: Date;

    @RequiredColumn()
    @Column({
        type: ColumnType.Boolean,
        nullable: false,
        unique: false,
        default: false,
    })
    public isMasterAdmin!: boolean;

    @RequiredColumn()
    @Column({
        type: ColumnType.Boolean,
        nullable: false,
        unique: false,
        default: false,
    })
    public isBlocked!: boolean;

    @Column({
        type: ColumnType.Phone,
        length: ColumnLength.Phone,
        nullable: true,
        unique: false,
    })
    public alertPhoneNumber?: Phone;

    @Column({
        type: ColumnType.OTP,
        length: ColumnLength.OTP,
        nullable: true,
        unique: false,
    })
    public alertPhoneVerificationCode?: string;

    @Column({
        type: ColumnType.Date,
        nullable: true,
        unique: false,
    })
    public alertPhoneVerificationCodeRequestTime?: Date;

    @Column({
        type: ColumnType.Phone,
        length: ColumnLength.Phone,
        nullable: true,
        unique: false,
    })
    public tempAlertPhoneNumber!: Phone;

    /*
     * @Column()
     * public sso!: SSO;
     */

    /*
     * @Column({
     *     nullable: true,
     * })
     * public createdBy!: User;
     */

    /*
     * @Column()
     * public isBlockedByUser!: User;
     */

    /*
     * @Column()
     * public deletedByUser!: User;
     */
}

export default User;