# Functional Test Specification

This document details the expected functionality of the Procurement Concierge Program's web application. It should be updated regularly to reflect new features and changes to existing features. This document can also serve as a Quality Assurance testing plan.

## Table of Contents

<!-- toc -->

- [Contribution Guidelines](#contribution-guidelines)
  * [Specification Definitions](#specification-definitions)
    + [Specification Structure](#specification-structure)
  * [Feature Definitions](#feature-definitions)
    + [Feature Definition Structure](#feature-definition-structure)
    + [Feature Definition Example 1](#feature-definition-example-1)
    + [Feature Definition Example 2](#feature-definition-example-2)
    + [Tips for Writing Feature Definitions](#tips-for-writing-feature-definitions)
- [Specifications](#specifications)
  * [User Management](#user-management)
    + [Program Staff](#program-staff)
    + [Buyers](#buyers)
    + [Vendors](#vendors)
    + [Anonymous Users](#anonymous-users)
      - [Sign In](#sign-in)
      - [Sign Up](#sign-up)
      - [Forgot/Reset Password](#forgotreset-password)
      - [Change Password](#change-password)
    + [All Users](#all-users)
      - [Terms & Conditions](#terms--conditions)
  * [Requests for Information](#requests-for-information)
    + [Program Staff](#program-staff-1)
    + [Buyers](#buyers-1)
    + [Vendors](#vendors-1)
    + [Anonymous Users](#anonymous-users-1)
    + [All Users](#all-users-1)
  * [Requests for Information Responses](#requests-for-information-responses)
    + [Program Staff](#program-staff-2)
    + [Buyers](#buyers-2)
    + [Vendors](#vendors-2)
    + [Anonymous Users](#anonymous-users-2)
    + [All Users](#all-users-2)
  * [Discovery Day Sessions](#discovery-day-sessions)
    + [Program Staff](#program-staff-3)
    + [Buyers](#buyers-3)
    + [Vendors](#vendors-3)
    + [Anonymous Users](#anonymous-users-3)
    + [All Users](#all-users-3)
  * [Vendor-Initiated Ideas](#vendor-initiated-ideas)
    + [Program Staff](#program-staff-4)
    + [Buyers](#buyers-4)
    + [Vendors](#vendors-4)
    + [Anonymous Users](#anonymous-users-4)
    + [All Users](#all-users-4)
  * [Static Pages](#static-pages)
    + [Program Staff](#program-staff-5)
    + [Buyers](#buyers-5)
    + [Vendors](#vendors-5)
    + [Anonymous Users](#anonymous-users-5)
    + [All Users](#all-users-5)
  * [Feedback](#feedback)
    + [Program Staff](#program-staff-6)
    + [Buyers](#buyers-6)
    + [Vendors](#vendors-6)
    + [Anonymous Users](#anonymous-users-6)
    + [All Users](#all-users-6)

<!-- tocstop -->

## Contribution Guidelines

This section describes the structure of this document, and how to add to, or modify, it.
This document is written in Markdown, and is stored in the web app's GitHub repository to ensure
its version history is tracked with Git.

### Specification Definitions

All functional specifications are listed under the [Specifications](#specifications) heading.
Each specification describes a subset of the web app's features, typically limited to a specific domain.
For example, a specification may describe all features related to "Requests for Information".

Each specification also lists features grouped by each of the web app's user personas.
The user persona groupings are:

- Program Staff
- Public Sector Buyers
- Vendors
- Anonymous Users (users that have not signed in)
- All Users

The following snippet describes the structure of a specification, and can be used as a template when
adding new specifications to this document.

#### Specification Structure

```markdown
### [Specification Name, e.g. "Requests for Information"]

#### Program Staff

[List of Features]

#### Buyers

[List of Features]

#### Vendors

[List of Features]

#### Anonymous Users

[List of Features]

#### All Users

[List of Features]
```

### Feature Definitions

Each feature defined under each user persona should be structured using the following syntax (similar to Cucumber's BDD language, [Gherkin](https://cucumber.io/docs/gherkin/reference/)):

#### Feature Definition Structure

```markdown
Given [PREMISE]  
[And [ADDITIONAL_PREMISE]]  
When [ACTION]  
[And [ADDITIONAL_ACTION]]  
Then [OUTCOME]  
[And [ADDITIONAL_OUTCOME]].
```

Note that the "And" clauses are optional, and each line in a feature definition ends with two blank spaces, which is how new lines are authored in Markdown.

The following snippets provide examples of how actual feature definitions should be authored.

#### Feature Definition Example 1

```markdown
Given the Program Staff has accepted the terms and conditions  
When the Program Staff clicks a link to a User's profile  
Then the Program Staff is shown the User's profile.
```

#### Feature Definition Example 2

```markdown
Given the Program Staff has accepted the terms and conditions  
And the Program Staff is viewing a Buyer profile  
When the Program Staff changes the Buyer's verification status using a dropdown  
Then the Buyer's verification status is changed to the Program Staff's selection.
```

#### Tips for Writing Feature Definitions

- Each feature definition should explicitly define its premises. For example, note how "Feature Definition Example 2" above does not implicitly rely on the premise that a Program Staff has accepted the terms and conditions from "Feature Definition Example 1" to view a Buyer's profile. In other words, a feature definition should not rely on premises from other definitions — they should be as comprehensive as possible.
- Always capitalise user personas, and refer to them explicitly. For example, "Given the **P**rogram **S**taff...". i.e. Never refer to users with pronouns (e.g. "they"). If you need to refer to a generic user, simply refer to them as "User."
- Each clause in a feature definition should be separated by a new line (two blank spaces at the end of each line in Markdown).
- Multiple features should be separated by a paragraph (a full blank line between feature definitions in Markdown).
- Other than capitalisation, feature definitions (generally) do not require punctuation, except for a full stop at the end of the definition.

## Specifications

### User Management

#### Program Staff

##### Sign Up

###### Scenario: Program Staff wants to create a Program Staff account  
Given the Program Staff is viewing the users listing page  
When the Program Staff clicks "Create a Program Staff Account"  
Then the Program Staff is directed to the sign up: step 1 page for Program Staff.

###### Scenario: Program Staff supplies valid email address and password (and password confirmation) when creating a Program Staff account  
Given the Program Staff is viewing the sign up: step 1 page for Program Staff  
When the Program Staff enters a valid email address and password (and password confirmation) correctly  
And clicks "Next"  
Then the Program Staff is directed to the sign up: step 2 page for Program Staff.

###### Scenario: Program Staff supplies email address already associated with an account when creating a Program Staff account
Given the Program Staff is viewing the sign up: step 1 page for Program Staff  
And the new Program Staff has an active account  
When the Program Staff enters a valid email address and password (and password confirmation) correctly  
And clicks "Next"  
Then the Program Staff is directed to the sign up: step 2 page for Program Staff.

###### Scenario: Program Staff supplies email address already associated with an account and has completed the registration process for a Program Staff account
Given the Program Staff is viewing the sign up: step 2 page for Program Staff  
And the new Program Staff has an active account  
When the Program Staff clicks "Create Account"  
Then the Program Staff is redirected to the sign up: step 1 page for Program Staff  
And the Program Staff is presented with an error message.

###### Scenario: Program Staff supplies an invalid email address when creating a Program Staff account  
Given the Program Staff is viewing the sign up: step 1 page for Program Staff  
When the Program Staff enters an invalid email address and password (and password confirmation) correctly  
Then the Program Staff is presented with an error message, "Please enter a valid email."  

###### Scenario: Program Staff supplies password confirmation incorrectly when creating a Program Staff account  
Given the Program Staff is viewing the sign up: step 1 page for Program Staff  
When the Program Staff enters a valid email address and password but re-enter the password confirmation incorrectly  
Then the Program Staff is presented with the error message, "Password confirmation doesn’t match original password."  

###### Scenario: Program Staff completes registration process for creating a Program Staff account  
Given the Program Staff is viewing the sign up: step 2 page for Program Staff  
And the new Program Staff does not already have an account associated with the email address   
When the Program Staff supplies all required information  
And clicks "Create Account"  
Then the Program Staff is directed to the user listing page  
And the new Program Staff will receive  
And the new Program Staff is sent an email to confirm that the Program Staff’s account has been created.  

##### Managing User Profiles

###### Scenario: Program Staff wants to view a list of all system users  
Given the Program Staff is signed in    
When the Program Staff clicks "Users" in the main navigation bar  
Then the Program Staff is directed to the user listing page.

###### Scenario: Program Staff wants to filter the list of all system users  
Given the Program Staff is signed in  
And is viewing the user listing page  
When the Program Staff selects a filter using an available dropdown  
Then the user listing table data is filtered accordingly.

###### Scenario: Program Staff wants to search the list of all system users  
Given the Program Staff is signed in  
And is viewing the user listing page  
When the Program Staff enters at least two characters into the available search bar  
Then the user listing table data is filtered accordingly.
 
###### Scenario: Program Staff wants to view another user's profile and has accepted the terms and conditions  
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the user listing page  
When the Program Staff clicks the user's name to view the user's profile  
Then the Program Staff is directed to the appropriate user's profile page.

###### Scenario: Program Staff wants to view another user's profile and has not accepted the terms and conditions  

Given the Program Staff is signed in  
And has not accepted the terms and conditions
And is viewing the user listing page  
When the Program Staff clicks the user's name to view the user's profile  
Then the Program Staff is presented with an alert to review the terms and conditions.

###### Scenario: Program Staff wants to update a Public Sector Buyer's account status  
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing a Buyer's user profile  
When the Program Staff changes the Buyer's account status using the available dropdown  
Then the Buyer's account status is changed to the Program Staff's selection  
And the Buyer is sent an email to notify of the account status change.

###### Scenario: Program Staff wants to initiate the deactivation of another Program Staff's account  
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing a Program Staff's user profile  
When the Program Staff clicks "Deactivate Account"  
Then the Program Staff is presented with an alert to confirm the deactivation of a Program Staff's account.

###### Scenario: Program Staff wants to confirm the deactivation of another Program Staff's account  
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm the deactivation of a Program Staff's account  
When the Program Staff clicks "Yes, deactivate this account"  
Then the other Program Staff's account is deactivated  
And the other Program Staff is sent an email notification  
And the Program Staff is directed to the user listing page.

###### Scenario: Program Staff wants to cancel the deactivation of another Program Staff's account  
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm the deactivation of a Program Staff's account  
When the Program Staff clicks "Cancel"  
Then the alert closes  
And the Program Staff is directed back to the other Program Staff's user profile.

#### Buyers

##### User Profile

###### Scenario: Buyer wants to add an Industry Sector when editing the Buyer’s user profile  
Given the Buyer is signed in  
And the Buyer is viewing the Buyer’s user profile  
And the Buyer’s user profile is open for editing by the Buyer  
When the Buyer clicks “Add” to add an Industry Sector  
Then an additional Industry Sector dropdown field will appear.

###### Scenario: Buyer wants to add an Area of Interest when editing the Buyer’s user profile  
Given the Buyer is signed in  
And the Buyer is viewing the Buyer’s user profile  
And the Buyer’s user profile is open for editing by the Buyer  
When the Buyer clicks “Add” to add an Area of Interest    
Then an additional Area of Interest dropdown field will appear.

###### Scenario: Buyer wants to remove an Industry Sector when editing the Buyer’s user profile  
Given the Buyer is signed in  
And the Buyer is viewing the Buyer’s user profile  
And the Buyer’s user profile is open for editing by the Buyer  
And at least two Industry Sector dropdown fields are present  
When the Buyer clicks the trash can icon next to an Industry Sector dropdown field  
Then the Industry Sector dropdown field is removed.

###### Scenario: Buyer wants to remove an Area of Interest when editing the Buyer’s user profile  
Given the Buyer is signed in  
And the Buyer is viewing the Buyer’s user profile  
And the Buyer’s user profile is open for editing by the Buyer  
And at least two Area of Interest dropdown fields are present  
When the Buyer clicks the trash can icon next to an Area of Interest dropdown field  
Then the Area of Interest dropdown field is removed.

##### Account Deactivation

###### Scenario: Buyer wants to initiate the deactivation of the Buyer's account  
Given the Buyer is signed in   
And the Buyer is viewing the Buyer's user profile  
When the Buyer clicks "Deactivate Account"  
Then the Buyer is presented with an alert to confirm the deactivation of the Buyer's account.

###### Scenario: Buyer wants to confirm the deactivation of the Buyer's account  
Given the Buyer is signed in  
And is viewing the alert to confirm the deactivation of the Buyer's account  
When the Buyer clicks "Yes, deactivate my account"  
Then the Buyer's account is deactivated  
And the Buyer is sent an email notification  
And the Buyer is directed to the landing page.

###### Scenario: Buyer wants to cancel the deactivation of the Buyer's account  
Given the Buyer is signed in  
And is viewing the alert to confirm the deactivation of the Buyer's account  
When the Buyer clicks "Cancel"  
Then the alert closes  
And the Buyer is directed back to the Buyer's user profile.

#### Vendors

##### User Profile

###### Scenario: Vendor wants to add an Industry Sector when editing the Vendor’s user profile  
Given the Vendor is signed in  
And the Vendor is viewing the Vendor’s user profile  
And the Vendor’s user profile is open for editing by the Vendor  
When the Vendor clicks “Add” to add an Industry Sector  
Then an additional Industry Sector dropdown field will appear.

###### Scenario: Vendor wants to add an Area of Interest when editing the Vendor’s user profile  
Given the Vendor is signed in  
And the Vendor is viewing the Vendor’s user profile  
And the Vendor’s user profile is open for editing by the Vendor  
When the Vendor clicks “Add” to add an Area of Interest    
Then an additional Area of Interest dropdown field will appear.

###### Scenario: Vendor wants to remove an Industry Sector when editing the Vendor’s user profile  
Given the Vendor is signed in  
And the Vendor is viewing the Vendor’s user profile  
And the Vendor’s user profile is open for editing by the Vendor  
And at least two Industry Sector dropdown fields are present  
When the Vendor clicks the trash can icon next to an Industry Sector dropdown field  
Then the Industry Sector dropdown field is removed.

###### Scenario: Vendor wants to remove an Area of Interest when editing the Vendor’s user profile  
Given the Vendor is signed in  
And the Vendor is viewing the Vendor’s user profile  
And the Vendor’s user profile is open for editing by the Vendor  
And at least two Area of Interest dropdown fields are present  
When the Vendor clicks the trash can icon next to an Area of Interest dropdown field  
Then the Area of Interest dropdown field is removed.

##### Account Deactivation

###### Scenario: Vendor wants to initiate the deactivation of the Vendor's account  
Given the Vendor is signed in   
And the Vendor is viewing the Vendor's user profile  
When the Vendor clicks "Deactivate Account"  
Then the Vendor is presented with an alert to confirm the deactivation of the Vendor's account.

###### Scenario: Vendor wants to confirm the deactivation of the Vendor's account  
Given the Vendor is signed in  
And is viewing the alert to confirm the deactivation of the Vendor's account  
When the Vendor clicks "Yes, deactivate my account"  
Then the Vendor's account is deactivated  
And the Vendor is sent an email notification  
And the Vendor is directed to the landing page.

###### Scenario: Vendor wants to cancel the deactivation of the Vendor's account  
Given the Vendor is signed in  
And is viewing the alert to confirm the deactivation of the Vendor's account  
When the Vendor clicks "Cancel"  
Then the alert closes  
And the Vendor is directed back to the Vendor's user profile.

#### Anonymous Users

##### Sign In

###### Scenario: User supplies correct email address and password when attempting to sign in  
Given the User is viewing the sign in page  
And the User has an account  
When the User enters a valid email address and password correctly  
And clicks "Sign In"  
Then the User is directed to the RFIs page.

###### Scenario: User does not supply correct email address and/or password when attempting to sign in  
Given the User is viewing the sign in page  
When the User enters a valid email address and/or password incorrectly  
And clicks "Sign In"  
Then the User is presented with an error message.

###### Scenario: User attempts to sign in, but does not have an account
Given the User is viewing the sign in page  
And the User does not have an account  
When the User clicks "sign up here"  
Then the User is directed to the sign up: step 1 page.

##### Sign Up 

###### Scenario: User wants to sign up for a Public Sector Buyer account  
Given the User is viewing the sign up: step 1 page  
When the User clicks "Select" in the Public Sector Buyer card  
Then the User is directed to the sign up: step 2 page for Public Sector Buyers.

###### Scenario: User wants to sign up for a Vendor account  
Given the User is viewing the sign up: step 1 page  
When the User clicks "Select" in the Vendor card  
Then the User is directed to the sign up: step 2 page for Vendors.

###### Scenario: User supplies valid email address and password (and password confirmation) when signing up for a Public Sector Buyer account  
Given the User is viewing the sign up: step 2 page for Public Sector Buyers  
When the User enters a valid email address and password (and password confirmation) correctly  
And clicks "Next"  
Then the User is directed to the sign up: step 3 page for Public Sector Buyers.

###### Scenario: User supplies email address already associated with an account when signing up for a Public Sector Buyer account  
Given the User is viewing the sign up: step 2 page for Public Sector Buyers  
And the User has an active account  
When the User enters a valid email address and password (and password confirmation) correctly  
And clicks "Next"  
Then the User is directed to the sign up: step 3 page for Public Sector Buyers.

###### Scenario: User supplies email address already associated with an account and has completed the registration process for a Public Sector Buyer account 
Given the User is viewing the sign up: step 4 page for Public Sector Buyers  
And the User has an active account  
When the User clicks "Create Account"  
Then the User is redirected to the sign up: step 2 page for Public Sector Buyers  
And the User is presented with an error message.

###### Scenario: User supplies an invalid email address when signing up for a Public Sector Buyer account  
Given the User is viewing the sign up: step 2 page for Public Sector Buyers  
When the User enters an invalid email address and password (and password confirmation) correctly  
Then the User is presented with an error message, "Please enter a valid email."

###### Scenario: User supplies password confirmation incorrectly when signing up for a Public Sector Buyer account  
Given the User is viewing the sign up: step 2 page for Public Sector Buyers  
When the User enters a valid email address and password but re-enter the password confirmation incorrectly  
Then the User is presented with the error message, "Password confirmation doesn’t match original password."

###### Scenario: User completes step 3 of 4 when signing up for a Public Sector Buyer account  
Given the User is viewing the sign up: step 3 page for Public Sector Buyers  
When the User provides all required information  
And clicks "Next"  
Then the User is directed to the sign up: step 4 page for Public Sector Buyers.

###### Scenario: User completes step 4 of 4 when signing up for a Public Sector Buyer account  
Given the User is viewing the sign up: step 4 page for Public Sector Buyers  
And the User does not already have an account associated with the email address the User has supplied  
When the User provides at least one Industry Sector   
And the User provides at least one Area of Interest  
And clicks "Create Account"  
Then the User is directed to the terms and conditions page  
And the User is sent an email to confirm that the User’s account has been created.

###### Scenario: User wants to add an Industry Sector when creating a Public Sector Buyer account  
Given the User is viewing the sign up: step 4 page for Public Sector Buyers  
When the User clicks "Add" to add an Industry Sector  
Then an additional Industry Sector dropdown field will appear.

###### Scenario: User wants to add an Area of Interest when creating a Public Sector Buyer account  
Given the User is viewing the sign up: step 4 page for Public Sector Buyers  
When the User clicks "Add" to add an Area of Interest  
Then an additional Area of Interest dropdown field will appear.

###### Scenario: User wants to remove an Industry Sector when creating a Public Sector Buyer account  
Given the User is viewing the sign up: step 4 page for Public Sector Buyers  
And at least two Industry Sector dropdown fields are present  
When the User clicks the trash can icon next to an Industry Sector dropdown field  
Then the Industry Sector dropdown field is removed.

###### Scenario: User wants to remove an Area of Interest when creating a Public Sector Buyer account  
Given the User is viewing the sign up: step 4 page for Public Sector Buyers  
And at least two Area of Interest dropdown fields are present  
When the User clicks the trash can icon next to an Area of Interest dropdown field  
Then the Area of Interest dropdown field is removed.

###### Scenario: User supplies valid email address and password (and password confirmation) when signing up for a Vendor account  
Given the User is viewing the sign up: step 2 page for Vendors  
When the User enters a valid email address and password (and password confirmation) correctly  
And clicks "Next"  
Then the User is directed to the sign up: step 3 page for Vendors.  

###### Scenario: User supplies email address already associated with an account when signing up for a Vendor account  
Given the User is viewing the sign up: step 2 page for Vendors  
And the User has an active account  
When the User enters a valid email address and password (and password confirmation) correctly  
And clicks "Next"  
Then the User is directed to the sign up: step 3 page for Vendors.  

###### Scenario: User supplies email address already associated with an account and has completed the registration process for a Vendor account  
Given the User is viewing the sign up: step 4 page for Vendors  
And the User has an active account  
When the User clicks "Create Account"  
Then the User is redirected to the sign up: step 2 page for Vendors  
And the User is presented with an error message.  

###### Scenario: User supplies an invalid email address when signing up for a Vendor account  
Given the User is viewing the sign up: step 2 page for Vendors  
When the User enters an invalid email address and password (and password confirmation) correctly  
Then the User is presented with an error message, "Please enter a valid email."  

###### Scenario: User supplies password confirmation incorrectly when signing up for a Vendor account  
Given the User is viewing the sign up: step 2 page for Vendors  
When the User enters a valid email address and password but re-enter the password confirmation incorrectly  
Then the User is presented with the error message, "Password confirmation doesn’t match original password."  

###### Scenario: User completes step 3 of 4 when signing up for a Vendor account  
Given the User is viewing the sign up: step 3 page for Vendors  
When the User provides all required information  
And clicks "Next"  
Then the User is directed to the sign up: step 4 page for Vendors.  

###### Scenario: User’s Head Office Location is located within British Columbia  
Given the User is viewing the sign up: step 3 page for Vendors  
When the User selects “British Columbia” from the “Head Office Location” dropdown list  
Then the “City” field is presented as a required field  

###### Scenario: User’s Head Office Location is located anywhere other than British Columbia  
Given the User is viewing the sign up: step 3 page for Vendors  
When the User selects any option other than “British Columbia” from the “Head Office Location” dropdown list  
Then the “City” field remains an optional field  

###### Scenario: User completes step 4 of 4 when signing up for a Vendor account  
Given the User is viewing the sign up: step 4 page for Vendors  
And the User does not already have an account associated with the email address the User has supplied  
When the User provides at least one Industry Sector  
And the User provides at least one Area of Interest  
And clicks "Create Account"  
Then the User is directed to the terms and conditions page  
And the User is sent an email to confirm that the User’s account has been created.  

###### Scenario: User wants to add an Industry Sector when creating a Vendor account  
Given the User is viewing the sign up: step 4 page for Vendors  
When the User clicks "Add" to add an Industry Sector  
Then an additional Industry Sector dropdown field will appear.  

###### Scenario: User wants to add an Area of Interest when creating a Vendor account  
Given the User is viewing the sign up: step 4 page for Vendors  
When the User clicks "Add" to add an Area of Interest  
Then an additional Area of Interest dropdown field will appear.  

###### Scenario: User wants to remove an Industry Sector when creating a Vendor account  
Given the User is viewing the sign up: step 4 page for Vendors  
And at least two Industry Sector dropdown fields are present  
When the User clicks the trash can icon next to an Industry Sector dropdown field  
Then the Industry Sector dropdown field is removed.  

###### Scenario: User wants to remove an Area of Interest when creating a Vendor account  
Given the User is viewing the sign up: step 4 page for Vendors  
And at least two Area of Interest dropdown fields are present  
When the User clicks the trash can icon next to an Area of Interest dropdown field  
Then the Area of Interest dropdown field is removed.  

##### Forgot/Reset Password

###### Scenario: User has forgotten the password associated with the User’s account when attempting to sign in  
Given the User is viewing the sign in page  
And the User has forgotten the password associated with the User’s account  
When the User clicks "Forgotten Your Password?"  
Then the User is directed to the forgot password page.

###### Scenario: User supplies a valid email address when requesting to reset the User’s password  
Given the User is viewing the forgot password page  
And the User has an account  
When the User enters a valid email address  
And clicks "Reset Password"  
Then the User is directed to a confirmation page  
And the User is sent an email with a link to reset the password associated with the User’s account.

###### Scenario: User supplies an invalid email address when requesting to reset the User’s password  
Given the User is viewing the forgot password page  
When the User enters an invalid email address  
Then the User is presented with an error message, "Please enter a valid email."

###### Scenario: User has submitted a request to reset the password associated with the User’s account  
Given the User has requested the password associated with the User’s account to be reset  
And the User has received the reset password email  
When the User clicks "Reset Your Password" in the reset password email  
Then the User is directed to the reset password page.

###### Scenario: User supplies new password and correctly re-enters the new password when attempting to reset the User’s password  
Given the User is viewing the reset password page  
When the User enters a new password and re-enters the new password correctly  
And clicks "Reset Password"  
Then the User is directed to a confirmation page.

###### Scenario: User supplies new password and incorrectly re-enters the new password when attempting to reset the User’s password  
Given the User is viewing the reset password page  
When the User enters a new password and re-enters the new password incorrectly  
Then the User is presented with an error message.

##### Change Password

###### Scenario: User wants to change the password associated with the User’s account
Given the User is signed in  
And the User is viewing the User’s profile  
When the User clicks "Change Password"  
Then the User is directed to the change password page.

###### Scenario: User supplies current password and new password correctly when attempting to change the User’s password  
Given the User is viewing the change password page  
When the User enters the User’s current password and new password correctly  
And clicks "Update Password"  
Then the User is directed to a confirmation page.

###### Scenario: User supplies current password incorrectly and new password correctly when attempting to change the User’s password  
Given the User is viewing the change password page  
When the User enters the User’s current password incorrectly and new password correctly  
And clicks "Update Password"  
Then the User is presented with the error message, "Please enter your correct password."

###### Scenario: User supplies current password and new password correctly and new password confirmation incorrectly when attempting to change the User’s password  
Given the User is viewing the change password page  
When the User enters the User’s current password and new password correctly but re-enters the new password confirmation incorrectly  
Then the User is presented with the error message, "Password confirmation doesn’t match original password."  

#### All Users

##### Terms & Conditions

###### Scenario: User skips terms and conditions during initial registration  
Given the User is viewing the terms and conditions page  
And the User has been directed to the terms and conditions after completing the registration process  
When the User clicks "Skip"  
Then the User is directed to the RFIs page  
And the User’s profile will state, "You have not agreed to the Terms & Conditions."

###### Scenario: User skips terms and conditions when reviewing on User profile  
Given the User is viewing the terms and conditions page  
And the User has not accepted the terms and conditions  
When the User clicks "Skip"  
Then the User is directed to the User’s profile page  
And the User’s profile will state, "You have not agreed to the Terms & Conditions."

###### Scenario: User accepts the terms and conditions during initial registration  
Given the User is viewing the terms and conditions page  
And the User has not accepted the terms and conditions  
When the User clicks "I Accept"  
Then the User is directed to the RFIs page  
And the User’s profile will state, "You agreed to the Terms and Conditions on [date] at [time]."

###### Scenario: User accepts the terms and conditions from the User’s profile  
Given the User is viewing the terms and conditions page  
And the User has not accepted the terms and conditions  
And the User is signed in  
When the User clicks "I Accept"  
Then the User is directed to the User’s profile page  
And the User’s profile will state, "You agreed to the Terms and Conditions on [date] and [time]."

###### Scenario: User has not accepted the terms and conditions  
Given the User has not accepted the terms and conditions  
And the User is signed in  
When the User views the User’s profile  
Then the User’s profile will state, "You have not agreed to the Terms & Conditions."

###### Scenario: User has accepted the terms and conditions  
Given the User has accepted the terms and conditions  
And the User is signed in  
When the User views the User’s profile  
Then the User’s profile will state, "You agreed to the Terms and Conditions on [date] and [time]."

###### Scenario: User is presented with an alert to review the terms and conditions and wants to do so  
Given the User has not accepted the terms and conditions  
And has been presented with an alert to review the terms and conditions when attempting to complete an action  
When the User clicks "Review Terms & Conditions"  
Then the User is directed to the terms and conditions page.  

###### Scenario: User is presented with an alert to review the terms and conditions and does not want to do so
Given the User has not accepted the terms and conditions  
And has been presented with an alert to review the terms and conditions when attempting to complete an action  
When the User clicks "Go Back"  
Then the User is directed back to the page the User was previously on.

##### User Profile

###### Scenario: User wants to view the User's user profile  
Given the User is signed in  
When the User clicks “My Profile” in the main navigation bar  
Then the User is directed the User’s user profile.

###### Scenario: User wants to edit the User's user profile  
Given the User is signed in  
And the User is viewing the User’s user profile  
When the User clicks “Edit Profile”  
Then the User’s user profile becomes open for editing by the User.

###### Scenario: User changes the User’s user profile information and wants to cancel the changes made  
Given the User is signed in  
And the User is viewing the User’s user profile  
And the User’s user profile is open for editing by the User  
When the User clicks “Cancel”  
Then the User’s changes made to the User’s user profile (if any) are cancelled  
And the User’s user profile is closed for editing.

###### Scenario: User changes the User’s user profile information and wants to save the changes made  
Given the User is signed in  
And the User is viewing the User’s user profile  
And the User’s user profile is open for editing by the User  
When the User changes their user profile information  
And clicks “Save Changes”  
And the User has supplied all required information  
Then the User’s user profile information is updated with the new information supplied by the User  
And the User’s user profile is closed for editing.

###### Scenario: User attempts to save changes made to User’s user profile and has not provided all required information  
Given the User is signed in  
And the User is viewing the User’s user profile  
And the User’s user profile is open for editing by the User  
When the User changes their user profile information  
And the User has not supplied all required information  
Then the User must supply the required information to activate the “Save Changes” button.

##### Sign Out

###### Scenario: User wants to sign out  
Given the User is signed in  
When the User clicks "Sign Out" in the main navigation bar  
Then the User is signed out  
And is directed to a confirmation page.

##### Account Reactivation 

###### Scenario: User wants to reactivate the User's deactivated account  
Given the User is viewing the sign in page  
And the User has an account that has been deactivated  
When the User enters the email address and password associated with the User's deactivated account correctly  
And clicks "Sign In"  
Then the User's account is reactivated  
And the User is directed to the RFIs page.

### Requests for Information

#### Program Staff

TODO

#### Buyers

TODO

#### Vendors

TODO

#### Anonymous Users

TODO

#### All Users

TODO

### Requests for Information Responses

#### Program Staff

TODO

#### Buyers

TODO

#### Vendors

TODO

#### Anonymous Users

TODO

#### All Users

TODO

### Discovery Day Sessions

#### Program Staff

TODO

#### Buyers

TODO

#### Vendors

TODO

#### Anonymous Users

TODO

#### All Users

TODO

### Vendor-Initiated Ideas

#### Program Staff

TODO

#### Buyers

TODO

#### Vendors

TODO

#### Anonymous Users

TODO

#### All Users

TODO

### Static Pages

#### Program Staff

TODO

#### Buyers

TODO

#### Vendors

TODO

#### Anonymous Users

TODO

#### All Users

TODO

### Feedback

#### Program Staff

TODO

#### Buyers

TODO

#### Vendors

TODO

#### Anonymous Users

TODO

#### All Users

TODO
