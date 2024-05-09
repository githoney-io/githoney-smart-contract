# Bounty Management System On-Chain Validation

Provide the on-chain validation for a bounty management system.

In the GitHoney system, there are three main actors:

- **Maintainer**: An individual or team maintaining a GitHub repository and having a task that requires completion within a deadline.

- **Contributor**: An individual or team that can complete the task by submitting a Pull Request (PR).

- **Admin**: A control actor that approves the changes made by the contributor and checks that the maintainer doesn't close the bounty when the PR is correct, in other words, it works as an oracle of the work done. The Admin is responsible for accepting the payment to the contributor or reclaiming the deposited assets by the maintainer.

### The Process Flow

1. A maintainer creates a bounty and deposits the **reward assets** (multi-asset) indicating the **deadline** to complete the task.

2. (**Optional**) Anyone can deposit more assets to increase the rewards.

3. A contributor indicates their willingness to work on the task and is assigned to the bounty. Only one contributor can be assigned at a time.

4. The admin decides if the bounty is **closed** or **merged**. The former means that the funds are sent back to the maintainer, and the latter means that the contributor receives their payment.

If the deadline passes before the bounty is merged, the only option is to close the bounty and return the funds to the maintainer, even if a contributor has been assigned.

### GitHoney Fees

- **Bounty Creation Fee**: The cost of creating a bounty. This is planned to be either 1 or 2 ADA.

- **Bounty Reward Fee**: This fee is to be paid to GitHoney if the PR is merged. It will be 5% of the reward.
